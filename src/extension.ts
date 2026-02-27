/*
 * AQI Armenia GNOME Shell Extension
 *
 * Copyright (C) 2026 David Eritsyan <dav.eritsyan@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import Clutter from "gi://Clutter";
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Soup from "gi://Soup?version=3.0";
import St from "gi://St";
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import { AQIColor } from "./constants.js"

type Region = {
  title: string,
  slug: string,
  temperature: number,
  humidity: number,
  aqi: number,
  pm2_5: number,
  pm10: number,
  no2: number,
  time: string,
}

export default class AQIArmeniaExtension extends Extension {
  gsettings?: Gio.Settings
  private indicator?: PanelMenu.Button
  private menu?: PopupMenu.PopupMenu;
  private aqi_value?: St.Label;
  private _timeout_id?: number;


  enable() {
    this.gsettings = this.getSettings();
    this.indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

    this.aqi_value = new St.Label({
      text: "AQI: Loading...",
      y_align: Clutter.ActorAlign.CENTER,
    });

    this.createMenu();
    this.indicator.add_child(this.aqi_value);

    this.updateAqi();

    this._timeout_id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 600000, () => {
      this.updateAqi();

      return GLib.SOURCE_CONTINUE;
    });
    Main.panel.addToStatusArea(this.uuid, this.indicator);
  }

  private getAqiColor(aqi: string): string {
    const value = Number(aqi);

    if (Number.isNaN(value)) return AQIColor.Default;
    if (value <= 50) return AQIColor.Good;
    if (value <= 100) return AQIColor.Moderate;
    if (value <= 150) return AQIColor.UnhealthyForSensitiveGroups;
    if (value <= 200) return AQIColor.Unhealthy;
    if (value <= 300) return AQIColor.VeryUnhealthy;
    return AQIColor.Hazardous;
  }

  private parseData(data: string): string {
    const regions: Region[] = JSON.parse(data).regions;
    const city = regions.find(r => r.title === this.gsettings?.get_string('city'));
    if (!city)
      return "?";;

    return city?.aqi.toString();
  }

  private setAqi(aqi: string): void {
    this.aqi_value?.clutter_text.set_markup(`AQI: <span foreground="${this.getAqiColor(aqi)}">${aqi}</span>`);
  }

  private fetchData(): Promise<string> {
    const session = new Soup.Session();
    const url = "https://airquality.am/en/air-quality-app/v1/stations.json";
    const message = Soup.Message.new('GET', url);

    return new Promise((resolve, reject) => {
      session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, result) => {
        try {
          const bytes = session?.send_and_read_finish(result);
          const data = new TextDecoder().decode(bytes?.get_data()!);
          resolve(this.parseData(data));
        } catch (e: any) {
          reject(e);
        }
      });
    });
  }

  private async updateAqi(): Promise<void> {
    const aqi: string = await this.fetchData().catch(() => "?");
    this.setAqi(aqi);
  }

  private createMenu(): void {
    this.menu = new PopupMenu.PopupMenu(this.indicator!, 0.0, St.Side.TOP);
    const refreshItem = new PopupMenu.PopupMenuItem("Refresh");
    refreshItem.connect("activate", () => { this.updateAqi() });
    this.menu.addMenuItem(refreshItem);
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    this.menu.addAction("Settings", () => this.openPreferences());

    this.indicator?.setMenu(this.menu);
  }

  disable() {
    this.gsettings = undefined;
    this.indicator?.destroy();
    this.menu = undefined;
    this.aqi_value = undefined;
    if (this._timeout_id) GLib.source_remove(this._timeout_id);
  }
}
