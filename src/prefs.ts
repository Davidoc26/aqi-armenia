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
import { City, CITIES, DISTRICTS, District } from "./constants.js"

export default class AQIArmeniaExtensionPreferences extends ExtensionPreferences {
  private settings?: Gio.Settings

  fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    this.settings = this.getSettings();
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
    const lock_screen_switch = new Adw.SwitchRow({
      "title": "Show on lock screen",
      "subtitle": "Keep indicator visible when device is locked",
    });
    const update_time_selector = new Adw.SpinRow({
      title: "Auto-update frequency (in minutes)",
      adjustment: new Gtk.Adjustment({
        lower: 10,
        upper: 60,
        value: this.settings.get_int("update-time"),
        stepIncrement: 1,
      }),
    });
    page.add(main_group);
    main_group.add(color_switch);
    main_group.add(lock_screen_switch);
    main_group.add(update_time_selector);

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

    const region_selector = new Adw.ComboRow({
      title: "Administrative district (Leave Yerevan to get data for the entire city)",
      model: new Gtk.StringList({
        strings: [...DISTRICTS],
      }),
    });

    city_selector.set_selected(CITIES.indexOf(this.settings.get_string('city') as City));
    region_selector.set_selected(DISTRICTS.indexOf(this.settings.get_string('yerevan-district') as District));
    page.add(city_group);
    city_group.add(city_selector);
    city_group.add(region_selector);

    window.add(page)

    this.settings.bind("lock-screen", lock_screen_switch, "active", Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind("update-time", update_time_selector, "value", Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind("colorized", color_switch, "active", Gio.SettingsBindFlags.DEFAULT);
    region_selector.connect("notify::selected", (selector: Adw.ComboRow) => {
      const selectedDistinct = selector.get_selected_item() as Gtk.StringObject;
      this.settings?.set_string("yerevan-district", selectedDistinct.get_string());
    })
    city_selector.connect("notify::selected", (selector: Adw.ComboRow) => {
      const selectedCity = selector.get_selected_item() as Gtk.StringObject;
      this.settings?.set_string("city", selectedCity.get_string());

      if (selectedCity.get_string() === "Yerevan") {
        region_selector.set_visible(true);
      }
      else {
        region_selector.set_visible(false);
      }
    })

    return Promise.resolve();
  }

}
