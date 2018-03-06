# sheit

Google Spreadsheet Agent.

# Purpose

`sheit` connects to a specified Google Sheet and reports when a change is made. 

# Installation

## Create a Service Account

This is a 2-legged oauth method and designed to be "an account that belongs to your application instead of to an individual end user" ([read more](https://developers.google.com/identity/protocols/OAuth2ServiceAccount)).

__Setup Instructions__

1. Go to the [Google Developers Console](https://console.developers.google.com/project)
2. Select your project or create a new one (and then select it)
3. Enable the Drive API for your project
  - In the sidebar on the left, expand __APIs & auth__ > __APIs__
  - Search for "drive"
  - Click on "Drive API"
  - click the blue "Enable API" button
4. Create a service account for your project
  - In the sidebar on the left, expand __APIs & auth__ > __Credentials__
  - Click blue "Add credentials" button
  - Select the "Service account" option
  - Select "Furnish a new private key" checkbox
  - Select the "JSON" key type option
  - Click blue "Create" button
  - your JSON key file is generated and downloaded to your machine (__it is the only copy!__)
  - note your service account's email address (also available in the JSON key file)

![Google API](./google_api.png)

Your JSON key file will look something like this: 

	{
	  "type": "service_account",
	  "project_id": "sheets-3",
	  "private_key_id": "80c5bofa92e960ce3681d927507987af52e64313",
	  "private_key": "-----BEGIN PRIVATE KEY-----\\n ... \n-----END PRIVATE KEY-----\n",
	  "client_email": "sheets-manager@sheets-3.iam.gserviceaccount.com",
	  "client_id": "925938743762113878486",
	  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
	  "token_uri": "https://accounts.google.com/o/oauth2/token",
	  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
	  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/sheets-manager%40sheets-3.iam.gserviceaccount.com"
	}

__5.__ Now that you have your service credentials, you will need to give this service permission to access your spreadsheet.

To share your spreadsheet with this applictions, copy the value of __client_email__ inside your JSON key file. Back in your spreadsheet, click the __Share__ button (top right), and paste the __client_email__ into the __People__ field to give it edit rights. Hit __Send__.

![spreadsheet](./spreadsheet.png)

# Usage

You're going to use your service account credentials to authenticate and connect to a Google Sheet, and then subscribe to change events:

```
require('sheit')({
    auth: require(`/path/to/service_creds.json`),
    sheetId: 'MNpDU9sY-9BVKlIs',
    emailField: 'assigned',
    descriptionField: 'hed',
    pollInterval: 20000
}).then(sheet => {
    sheet.on('started', row => {
        console.log('--started', row);
    });

    sheet.on('updated', row => {
        console.log('--updated', row);
    });

    sheet.on('error', err => {
        console.log(err);
    });
}).catch(err => {
    console.log(err)
});

```

You can get the `sheetId` from your spreadsheet's url:

https://docs.google.com/spreadsheets/d/**10BMNpDU9sY-9BVKPH9XGqLSO5d3Y5boXb-CBqpm9lIs**/edit#gid=0


# License

This is free software. The freedom of every file in this repository is protected by the AGPL-3.0 software license. Please see [the `./LICENSE` file](./LICENSE) for more information.

    Copyright (C) 2018 Sandro Pasquali <spasquali@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.