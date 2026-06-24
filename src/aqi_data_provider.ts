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

import GLib from 'gi://GLib';
import Soup from "gi://Soup?version=3.0";
import { RegionSlug } from "./constants.js";
import { Option, Region } from "./extension.js";

export class AQIDataProvider {

  private readonly session: Soup.Session = new Soup.Session();

  constructor() {
    this.session.set_user_agent("aqi-armenia-gnome-extension/1.0");
  }

  /**
   * Fetches AQI data from remote API for selected city/region.
   * Returns parsed Region object or undefined on failure.
   *
   * See: https://airquality.am/en/api-docs
   *
   * Note: The API requires a meaningful User-Agent identifying the application.
   * This extension sets a custom UA for identification.
   */
  public fetchData(slug: RegionSlug): Promise<Option<Region>> {
    const url = `https://airquality.am/en/air-quality-app/v1/region/${slug}.json`;
    const message = Soup.Message.new('GET', url);

    return new Promise((resolve, reject) => {
      this.session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, result) => {
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

  /**
   * Parses raw JSON response into Region model.
   */
  private parseData(data: string): Option<Region> {
    return JSON.parse(data);
  }
}
