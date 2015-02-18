Contributing
============

Pull requests are gladly accepted. We also really appreciate tests.


## Running Tests

Tests can be run by loading the following url in your browser `/test/run.html`

E.g. of running an individual test: `/test/run.html?spec=events/eventmanager-spec`


### Creating


#### Unit test

Here's how to create a new unit test:

 1. run `minit create:spec -n myspec`. This will create a `-spec.js` file where you can add your Jasmine assertions.
 2. Add the moduleId of the new spec to `/test/run.js`.


#### UI test

Here's how to create a new ui test:

 1. run `minit create:test -n mytest`. This will create a `mytest` directory that includes
     - an html file where you can add your component(s).
     - a js file that will serve as your fixture.
     - a spec file where you can add your Jasmine assertions.
 2. Add the moduleId of the new spec to `/test/run.js`.

 Overview:
The spec file queues up  the ui test and executes the assertions when the page under test (`mytest.html`) is loaded.

```javascript
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("mytest", function (testPage) {
    describe("test/ui/mytest-spec", function () {
        ...
    })
});
```


## Notes for Core Team


### git subtree

Git subtrees are like submodules, but better and easier for everyone involved. They allow you to import code from a different repository but instead of adding a *reference* to your repository, they add the **actual code** *and commit saying where the code came from*.

The great thing about subtrees is if you do not care about merging or splitting them, they **do not affect you**. You can treat the whole repository as you would normally. If the above describes you, you can stop reading now.


#### Installing

If you use OSX and homebrew, then `brew install git` will install the subtree command along with git.

Otherwise it is a single script you can download:

1. Download https://raw.github.com/git/git/master/contrib/subtree/git-subtree.sh
2. Make executable: `chmod a+x git-subtree.sh`
3. Rename to git-subtree: `mv git-subtree.sh git-subtree`
4. Move to a directory on your `PATH`


#### Using

Each section below has a description and example for each command, and a list of the subtrees in each of the montagejs
repositories with the command that you can copy and paste. See the Adding section for an example of what a subtree looks
like.


#### Merging/pulling

This will merge updates from the other repository while keeping any changes made to the subtree locally (for example deleted files).

```bash
git subtree pull --squash --prefix=$dir$ git@github.com:$repo$.git $commitOrTag$ -m "Update $name$ to $version$"
```


#### Mr ↣ Montage

```bash
git subtree pull --squash --prefix=packages/mr git@github.com:montagejs/mr.git $version -m "Update Mr to $version$"
```


#### Splitting

Splitting allows you take take changes to the subtree from your repository and commit them to the other one.

TODO: Write after splitting for the first time


#### Adding

This will add all the files in `repo` at `commit` under `dir`, and will create 2 commits

```bash
git subtree add --squash --prefix=$dir$ git@github.com:$repo$.git $commitOrTag$ -m "Add $name$ $version$ as a subtree"
```

```
commit 25303c2f71a7437f6cb4d8f2e277a2c0aca6040c
Author: Stuart Knightley <stuart@example.com>
Date:   Tue Jan 8 16:49:33 2013 +0000

    Squashed 'packages/mr/' content from commit fb221b7

    git-subtree-dir: packages/mr
    git-subtree-split: fb221b7322e581ab63aa5a8bdbf8ae5579c6b06c

commit f3cf33549b20e42da24bd55c211af8307092341a
Merge: 3e6a9e2 25303c2
Author: Stuart Knightley <stuart@example.com>
Date:   Tue Jan 8 16:49:33 2013 +0000

    Add Mr v0.12.0 as a subtree
```

