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
import { AQIColorProvider } from "./aqi_color_provider.js";
import { CityProvider } from "./city_provider.js";
import { UNKNOWN_AQI_VALUE } from "./constants.js";

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

type AQIValue = number | string;

export default class AQIArmeniaExtension extends Extension {
  private gsettings?: Gio.Settings
  private indicator?: PanelMenu.Button
  private menu?: PopupMenu.PopupMenu;
  private aqi_label?: St.Label;
  private aqi_value?: number | string;
  private _timeout_id?: number;
  private color_provider!: AQIColorProvider;
  private city_provider!: CityProvider;
  private settings_signal_ids?: number[];

  enable() {
    this.gsettings = this.getSettings();
    this.indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
    this.color_provider = new AQIColorProvider(this.gsettings);
    this.city_provider = new CityProvider(this.gsettings);
    this.settings_signal_ids = [];
    this.aqi_value = UNKNOWN_AQI_VALUE;

    this.aqi_label = new St.Label({
      text: "AQI: Loading...",
      y_align: Clutter.ActorAlign.CENTER,
    });

    this.createMenu();
    this.indicator.add_child(this.aqi_label);
    this.bindSettings();

    this.updateAqi();

    this._timeout_id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 600000, () => {
      this.updateAqi();

      return GLib.SOURCE_CONTINUE;
    });

    Main.panel.addToStatusArea(this.uuid, this.indicator);
  }

  private bindSettings(): void {
    const city_signal_id = this.gsettings!.connect("changed::city", () => this.updateAqi());
    this.settings_signal_ids?.push(city_signal_id);

    const district_signal_id = this.gsettings!.connect("changed::yerevan-district", () => this.updateAqi());
    this.settings_signal_ids?.push(district_signal_id);

    const color_signal_id = this.gsettings!.connect("changed::colorized", () => this.setAqiLabel(this.aqi_value!));
    this.settings_signal_ids?.push(color_signal_id);
  }

  private parseData(data: string): AQIValue {
    const regions: Region[] = JSON.parse(data).regions;
    const [city, district] = this.city_provider.getCity();
    if (district) {
      const d = regions.find(r => r.title === district);
      return d?.aqi.toString() ?? '?';
    }
    const region = regions.find(r => r.title === city);

    return region?.aqi ?? UNKNOWN_AQI_VALUE;
  }

  private setAqiLabel(aqi: AQIValue): void {
    if (!this.color_provider.isColorized()) {
      this.aqi_label?.clutter_text.set_markup(`AQI: ${aqi}`);
      return;
    }

    this.aqi_label?.clutter_text.set_markup(`AQI: <span foreground="${this.color_provider.getColor(aqi)}">${aqi}</span>`);
  }

  private fetchData(): Promise<AQIValue> {
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
    this.aqi_value = await this.fetchData().catch(() => UNKNOWN_AQI_VALUE);
    this.setAqiLabel(this.aqi_value);
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

  private diconnectSignals(): void {
    this.settings_signal_ids?.forEach(id => this.gsettings?.disconnect(id));
  }

  disable() {
    this.diconnectSignals();
    this.settings_signal_ids = undefined;
    this.gsettings = undefined;
    this.indicator?.destroy();
    this.menu = undefined;
    this.aqi_label = undefined;
    if (this._timeout_id) GLib.source_remove(this._timeout_id);
  }
}
