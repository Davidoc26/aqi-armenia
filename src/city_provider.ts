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

import Gio from "gi://Gio";
import { City, District } from "./constants.js";

export class CityProvider {
  constructor(private settings: Gio.Settings) { }

  public getCity(): [City, District?] {
    const city = this.settings.get_string('city') as City;

    if (city === "Yerevan") {
      const district = this.settings.get_string('yerevan-district') as District;
      return [city, district];
    }

    return [this.settings.get_string('city') as City];
  }

}
