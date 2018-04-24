# Styla Salesforce Commerce Cloud Cartridge

This cartridge connects your Salesforce Commerce Cloud with [Styla](http://www.styla.com/) Content Hub. The first diagram on [this page](https://styladocs.atlassian.net/wiki/spaces/CO/pages/9961481/Technical+Integration) should provide you an overview of what the plugin does and how it exchanges data with Styla. 

## Installation and Configuration

Please consult the [documentation](https://github.com/styladev/demandware/tree/master/documentation) folder for information on how to install and configure the cartridge. 

Please note that OCAPI needs to be configured for Styla to source product data and display products in your Content Hub(s) and enable adding them to your cart. This is also described in the documentation.

## Setup Process

The process of setting up your Content Hub(s) usually goes as follows:

1. Install and configure the cartridge on your stage using Content Hub IDs shared by Styla
2. Configure OCAPI on your stage
3. Share the stage URL, credentials and OCAPI endpoints with Styla, including URL parameters for different locales and currencies (if used by you)
4. Styla integrates product data from stage OCAPI, test your stage Content Hub and asks additional questions, if needed
5. Configure the cartridge and OCAPI on production, without linking to the Content Hub(s) there and, again, share the URL and OCAPI endpoints with Styla
6. Make sure your content is ready to go live
7. Styla conducts final User Acceptance Tests before the go live
8. Go live (you link to the Content Hub embedded on your production)

## Salesforce-certified and available on Marketplace

The latest version of this cartridge has been certified by Salesforce and can also be downloaded from its marketplace: https://xchange.demandware.com/docs/DOC-34370
