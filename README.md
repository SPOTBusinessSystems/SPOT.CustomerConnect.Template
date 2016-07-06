# SPOT.CustomerConnect.Template

This is the base HTML/JS templates for use with the SPOT API. These templates use AngularJS 1.4 and Bootstrap to create a full customer portal. The documentation for the API can be found at https://developer.spotpos.com/. To use this, you must be familiar with HTML and JavaScript. Experience with AngularJS is helpful. You can also learn more about AngularJS at https://angularjs.org/.

## Get Started ##
Inside the Template folder there are copies of the site based on template you want to start with. Currently there is only Default. Copy the Default folder into your website or application. In Index.html, remove "@TENANT/Template/" from all resource files.

In order to use the template, you must have acquired a session token from the API using the methods noted in the API getting started guide at https://developer.spotpos.com/gettingstarted.html. You will have to have 3 JavaScript variables set:

CustomerConnect.Config.AccountKey
CustomerConnect.Config.URL
CustomerConnect.Config.SessionId

Remember to always protect your SecurityID by keeping initial token retrieval in server-side code such as ASP.NET or PHP. Inject the returned session into your Index.html.

## Components ##
* Bootstrap - http://getbootstrap.com/
* AngularJS 1.4 - https://docs.angularjs.org
* Angular-UI - http://angular-ui.github.io/bootstrap/
* Angular-Wizard - https://github.com/mgonto/angular-wizard
* Angular-Dialogs - http://codepen.io/m-e-conroy/pen/rkIqv
* BlockUI - https://github.com/McNull/angular-block-ui
* Angular-Local-Storage - http://gregpike.net/demos/angular-local-storage/demo/demo.html

The site uses Bootstrap. This template comes with some prebuilt themes. Which theme is used is determined by their settings in the POS system. Alternatively, you can change this manually in Components/maincontroller.js. There is also a complete Bootstrap customizer at http://getbootstrap.com/customize/. 

## Folder Structure ##
* Scripts - These are all the JS dependencies.
* Content - These are all the CSS dependencies.
* Components - This is the app itself.
* Index.html - The primarily html file to navigate to.

### Components Folder ###
* Dialogs - This contains all the custom dialog forms displayed by Angular-Dialogs.
* Shared - These are re-usable common components (directives).
* Views - These are the different areas of the customer portal.
* app.js - Initial AngularJS declaration and configuration.
* maincontroller.js - This is run from the Index.html. This contains various loading components to get the site ready.
* service.js - This is the Angular service that acts as the data layer between the app and the SPOT.API.
