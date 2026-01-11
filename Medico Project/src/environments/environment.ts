/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
   firebaseConfig: {
    apiKey: "AIzaSyBFCBc_EV2-xr_f-5MHkJlHwDbVSH8g5mI",
    authDomain: "medicoauth.firebaseapp.com",
    projectId: "medicoauth",
    storageBucket: "medicoauth.firebasestorage.app",
    messagingSenderId: "930225989153",
    appId: "1:930225989153:web:994a52630d52b35330e560"
    // measurementId is optional for auth
  }
};
