{{name}}
==============

This is the Montage app template.

Note: Before working on your app you will need to add montage to it. You can
do this various ways depending on your version control preferences:

Add Montage as a submodule of the Git repository containing your app:

```
cd {{name}}
git init
git submodule add git@github.com:Motorola-Mobility/montage.git node_modules/montage
```

or just clone Montage to your app:

```
git clone git@github.com:Motorola-Mobility/montage.git bob/node_modules/montage
```

Layout
------

The template contains the following files and directories:

* `index.html`
* `package.json` – Describes your app and its dependencies
* `README.markdown` – This readme. Replace the current content with a description of your app
* `ui/` – Directory containing all the UI .reel directories.
  * `main.reel` – The main interface component
* `core/` – Directory containing all core code for your app.
* `node_modules/` – Directory containing all npm packages needed, including Montage. Any packages here must be included as `dependencies` in `package.json` for the Montage require to find them.
* `assets/` – Assets such as global styles and images for your app

Create the following directories if you need them:

* `locale/` – Directory containing localized content.
* `lib/` – Directory containing other JS libraries. If a library doesn’t support the CommonJS "exports" object it will need to be loaded through a `<script>` tag.
* `test/` – Directory containing tests for your app.