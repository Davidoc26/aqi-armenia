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
import { CITIES, City, DISTRICTS, District } from "./constants.js";

export default class AQIArmeniaExtensionPreferences extends ExtensionPreferences {
  private settings?: Gio.Settings

  fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    this.settings = this.getSettings();

    window.add(this.createGeneralSettingsPage());
    window.add(this.createMenuSettingsPage());

    return Promise.resolve();
  }

  createGeneralSettingsPage(): Adw.PreferencesPage {
    const page = new Adw.PreferencesPage({
      title: _("General"),
      icon_name: "dialog-information-symbolic",
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
        value: this.settings!.get_int("update-time"),
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

    const district_selector = new Adw.ComboRow({
      title: "Administrative district (Leave Yerevan to get data for the entire city)",
      model: new Gtk.StringList({
        strings: [...DISTRICTS],
      }),
      visible: this.settings!.get_string("city") === "Yerevan",
    });

    city_selector.set_selected(CITIES.indexOf(this.settings!.get_string("city") as City));
    district_selector.set_selected(DISTRICTS.indexOf(this.settings!.get_string("yerevan-district") as District));
    page.add(city_group);
    city_group.add(city_selector);
    city_group.add(district_selector);

    this.settings!.bind("lock-screen", lock_screen_switch, "active", Gio.SettingsBindFlags.DEFAULT);
    this.settings!.bind("update-time", update_time_selector, "value", Gio.SettingsBindFlags.DEFAULT);
    this.settings!.bind("colorized", color_switch, "active", Gio.SettingsBindFlags.DEFAULT);

    city_selector.connect("notify::selected", (selector: Adw.ComboRow) => {
      const selectedCity = selector.get_selected_item() as Gtk.StringObject;
      this.settings?.set_string("city", selectedCity.get_string());

      district_selector.set_visible(selectedCity.get_string() === "Yerevan");
    })

    district_selector.connect("notify::selected", (selector: Adw.ComboRow) => {
      const selectedDistrict = selector.get_selected_item() as Gtk.StringObject;
      this.settings?.set_string("yerevan-district", selectedDistrict.get_string());
    })

    return page;
  }

  createMenuSettingsPage(): Adw.PreferencesPage {
    const menu_page = new Adw.PreferencesPage({
      title: ("Menu Settings"),
      icon_name: "dialog-information-symbolic",
    });

    const display_group = new Adw.PreferencesGroup({
      title: "Display Options",
      description: "Choose which data to show in the indicator menu",
    });

    const pm25_switch = new Adw.SwitchRow({
      "title": "PM2.5",
    });

    const pm10_switch = new Adw.SwitchRow({
      "title": "PM10",
    });

    const humidity_switch = new Adw.SwitchRow({
      "title": "Humidity",
    });

    this.settings!.bind("pm25", pm25_switch, "active", Gio.SettingsBindFlags.DEFAULT);
    this.settings!.bind("pm10", pm10_switch, "active", Gio.SettingsBindFlags.DEFAULT);
    this.settings!.bind("humidity", humidity_switch, "active", Gio.SettingsBindFlags.DEFAULT);

    display_group.add(pm25_switch);
    display_group.add(pm10_switch);
    display_group.add(humidity_switch);
    menu_page.add(display_group);

    return menu_page;
  }

}
