// Copyright 2017 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * This file manages "problematic" URLs. For instance, if users are
 * creating links to Play Store URLs, they should user the Google Play
 * Url Builder (https://goo.gl/qycyHd) instead of the GA devtools app.
 *
 * See b/69681865 for more details.
 */

import React from 'react';
import {isRegExp} from 'lodash'


// Create a function that checks if a url matches a regular expression.
// I've refactored this into a separate function, because doing something
// like this:
//
//   matchesPattern = pattern => url => (new Regexp(pattern)).test(url)
//
// Would result in recompiling the regex every time.
const matchesRegexp = regexp => url => regexp.test(url)
const matches = pattern => isRegExp(pattern) ?
  matchesRegexp(pattern) :
  matchesRegexp(new RegExp(pattern, 'i'))


/**
 * Given a domain, create a function that returns true if the domain
 * matches a given URL. The domain is matched exactly, and can optionally
 * be prepended with http:// or https://.
 *
 * This function accepts regex patterns, but escapes all . characters.
 *
 * @return {(url:string) => boolean} a function that returns true if the
 * domain matches the given url exactly
 */
const domainMatches = domain =>
  matches('^(?:https?://)?(:?' + domain.replace('.', '\\.') + ')(?:$|[/?#])')

/**
 * Given a domain suffix, create a function that returns true if the
 * domain matches a given URL. The domain is matched as a suffix; that
 * is, the domain "google.com" will match "play.google.com",
 * "mail.google.com", etc, as well as just "google.com".
 *
 * This function accepts regex patterns, but escapes all . characters.
 *
 * @return {(url:string) => boolean} a function that returns true if the
 * domain matches the given url as a suffix
 */
const domainSuffix = suffix =>
  domainMatches(`(?:[a-z0-9-]+.)*(?:${suffix})`)

const googlePlayBuilderUrl = "https://developers.google.com/analytics/devguides/collection/android/v4/campaigns#google-play-url-builder"
const itunesStoreBuilderUrl = "https://developers.google.com/analytics/devguides/collection/ios/v3/campaigns#url-builder"

// Many fields in the badlist require a function with the signature
// "url => thing". Use literal to make a function that just returns a
// literal value
const literal = thing => url => thing
/**
 * BADLIST
 *
 * This list is the central definition of problematic URLs. It defines
 * a series of problematic conditions, which are problably mistakes on
 * the part of the user. Each problematic item is a test, which is a
 * function that returns true if the url object is problematic, along
 * with a render, which is a function taking a url and returning a React
 * Element. The rendered element is used to alert the user that there's
 * a problem.
 *
 * The eventLabel is used for Google Analytics reporting. This app
 * reports Problematic URL event; the label states which kind of URL
 * triggered the event.
 *
 * NOTE: In the future, we'll likely re-think these tools/pages based
 * on the fact that you're meant to use the URL builder in the Network
 * Settings section of our product for everything EXCEPT custom
 * campaigns. See b/69681865
 */
const badList = [{
  name: "Play Store URL",  // This is just for reference
  test: domainSuffix('play.google.com'),
  render: literal(<div>
    <strong>It appears you are creating a Google Play Store url.
    </strong> You should use the <a href={googlePlayBuilderUrl}
    target="_blank">Google Play URL Builder</a> instead when creating
    tracking links for Play Store apps.
  </div>),
  eventLabel: "Google Play Store",
}, {
  name: "iOS App Store URL",
  test: domainSuffix('itunes.apple.com'),
  render: literal(<div>
    <strong>It appears you are creating an iOS App Store url.
    </strong> You should use the <a href={itunesStoreBuilderUrl}
    target="_blank">iOS Campaign Tracking URL Builder</a> instead when
    creating tracking links for iOS App Store apps.
  </div>),
  eventLabel: "iOS App Store",
}, {
  name: "GA Dev Tools URL",
  test: domainSuffix('ga-dev-tools.appspot.com'),
  render: literal(<div>
    It appears that you are linking to this site, <code>
    ga-dev-tools.appspot.com</code>, instead of your own. You should
    put your own site's URL in the <strong>Website URL</strong> field,
    above.
  </div>),
  eventLabel: "GA Dev Tools",
}];

/**
 * Given a URL, use the problematic URLs list to either return a React
 * Element if the URL is problematic, or null if it's acceptable.
 * Additionally return an event label for Google Analytics Reporting.
 *
 * @param  {string | URL} url The URL to check. Should either be a
 *     string or a URL object.
 * @return {Object} An object containing the keys 'element'
 */
export default function renderProblematic(url) {
  for(const {test, render, eventLabel} of badList) {
    if(test(url)) {
      return {
        element:
          <div className="CampaignUrlResult-alert-box">{render(url)}</div>,
        eventLabel: eventLabel,
      }
    }
  }

  return {element: null, eventLabel: null}
}
