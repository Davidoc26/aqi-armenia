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

import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import { ExtensionPreferences, gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import { City, CITIES } from "./constants.js"

export default class AQIArmeniaExtensionPreferences extends ExtensionPreferences {
  _settings?: Gio.Settings

  fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    this._settings = this.getSettings();
    const page = new Adw.PreferencesPage({
      title: _('General'),
      icon_name: 'dialog-information-symbolic',
    });

    const main_group = new Adw.PreferencesGroup({
      title: "Main Settings",
    });
    const color_switch = new Adw.SwitchRow({
      "title": "Colorized AQI",
    });
    page.add(main_group);
    main_group.add(color_switch);

    const city_group = new Adw.PreferencesGroup({
      title: "City Selector",
      description: "Choose the city to display AQI for",
    });

    const city_selector = new Adw.ComboRow({
      title: "City",
      model: new Gtk.StringList({
        strings: [...CITIES],
      }),
    });
    city_selector.set_selected(CITIES.indexOf(this._settings.get_string('city') as City));
    page.add(city_group);
    city_group.add(city_selector);

    window.add(page)

    this._settings.bind("colorized", color_switch, "active", Gio.SettingsBindFlags.DEFAULT);
    city_selector.connect("notify::selected", (selector: Adw.ComboRow) => {
      const selectedCity = selector.get_selected_item() as Gtk.StringObject;
      this._settings?.set_string("city", selectedCity.get_string());
    })

    return Promise.resolve();
  }

}
