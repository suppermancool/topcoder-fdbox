# FBDOX

The project was generated with the [Angular Full-Stack Generator](https://github.com/DaftMonk/generator-angular-fullstack) version 4.1.4.

## Prerequisites

- [Git](https://git-scm.com/)
- [Node.js and npm](nodejs.org) Node = 6.2.2 (doesn't support 7.x)!
- [Gulp](http://gulpjs.com/) >= 3.9 (`npm install --global gulp-cli`)
- [MongoDB](https://www.mongodb.org/) - Keep a running daemon with `mongod`
- Stripe account (test or real account)

**Additional plugins/external libraries**

Install [LibreOffice](https://www.libreoffice.org/)

> Note: To improve the performance of preview generation, edit `/etc/libreoffice/sofficerc` and change `Logo=1` to `Logo=0`.

ImageMagick is also required
```
  $ apt-get install imagemagick
```

## Configuring the project:
`server/config`:

  - `local.env.js`: set environment variables (email, debug, domain, session)
  - `seed.js`: will populate the database on server start, if needed
  - `environment`:
    + `development.js`:
        + `mongo`: configure mongodb
        + `seedDB`: if set to `true` will re-populate db on server start
    + `index.js`: all the basic configurations
    + `production.js`: prod specific configurations
    + `shared.js`: configurations shared between server and client
    + `test.js`: test specific configurations
  - `seeds`: seed data to populate the db with


## Correct product template files path
`npm run correct-product-path`

## Correct finalproduct file paths
`npm run correct-finalproduct-path`

#### Mail Configuration
The project uses [nodemailer](https://nodemailer.com/about/) to send mails.
See docs for more configurations.
Right now the project uses gmail as main provider, set username & password in `config/local.env.js`.
If you have 2-fa for gmail, look here for generating an app password: https://support.google.com/accounts/answer/185833?hl=en

#### Translation configuration
The project uses [angular-translate](https://angular-translate.github.io/) for internationalization. Language files are placed in `client/app/i18n` folder. To add new language create a file in the i18n folder in register it in `client/app/app.config.js` file.

#### Stripe configuration
Register for stripe account and navigate to https://dashboard.stripe.com/account/apikeys to find your stripe API keys. Set them in `server/config/environment/shared.js` file under `stripe` key.

In the same file one can/should customize also:
- `billingDiscounts` - Discounts available
- `coupons` - Coupons available
- `subscriptionPlans` - Subscriptions plans available

as those will be created/synced with
stripe automatically.

For more details see `docs/Verification.docx`.


## Develop

1. Run `npm install` to install server dependencies.

2. Run `mongod` in a separate shell to keep an instance of the MongoDB Daemon running if it is not already.

3. Run `gulp serve` to start the development server. It should automatically open the client in your browser when ready. Default url is `http://localhost:3000`

## API
You can find the `swagger.yml` in the `docs` folder and/or [here online](https://devwork.xyz/swagger/?url=https://devwork.xyz/swagger/swagger-fbdox.json).

## Developer Notes
 - there's no logout endpoint on server, this is treated on frontend by deleting the jwt from header
 - change email is done through the [put] /users/me, by passing an email
 - additional users are created using same endpoint [post]/users
 - additional users removal is done using same endpoint [delete]/users/:id
 - Note that the static data&test data will be auto generated on project startup
 - All uploads will go into `products/assets/uploads`.
 - Note: `products/assets/uploads/templates` Contains all the uploaded zips, and the extracted templates and master files (only admin uploads).
 - Note: `products/assets/uploads/docx` Contains all the User generated documents.

## Testing/Verification

#### Verification frontend
1. Open `server/config/seeds/users.json` and note the email/password of the different type of users
2. Try login to the site with any of them
3. Click username in header to go to `/profile` and check permissions regarding user.
4. Click through the site. Testing links, modals, forms and etc.

#### Verification web services
See `docs/Verification.docx`

#### Test files
Included in the submissions in `docs/test-files` you'll find zips containing 1 to 5 and 9 documents, and some invalid zips/documents
to test the upload api.

Included in `client/assets/preview` are some ready created preview documents that will be presented to the user in the final step.

#### Postman
In the submission there are postman collection and environment files.

Note that the auth endpoints are configured to set a global var that's use by other endpoints for auth.
So, running the auth-admin endpoint will "log you in" as admin, same goes for the rest of auth tests.


## Demo videos
Included in the submission there are 2 videos (docs folder):
- first `admin cms demo.mp4` containing the cms demo
- second `postman api demo.mp4` containing the api demo in postman. Here you can track the runned "test" in the right checkbox list.

- `Home.mp4` containing demo for configurable home page
- `Products.mp4` containing demo for products page
- `Register-Login.mp4` containing demo for Register/Login
- `Accounts.mp4` containing demo for Manage Accounts

- `Product-Slider.mp4` containing demo for configuring displayed categories

Frontend demo:
 - https://drive.google.com/file/d/0B9hUeJomvQoXc195c0xUZnNsR1U/view?usp=sharing

Web services and stripe:
 - https://drive.google.com/file/d/0B9hUeJomvQoXSndKbWR2YTFQZjA/view?usp=sharing
