# Install gitbook dependencies & build gitbook
gitbook install && gitbook build

# checkout gh-pages
git checkout gh-pages

# pull origin gh-pages from origin
git pull origin gh-pages --rebase

# copy _book/ contents after build
cp -R _book/* .

# remove node_modules, _book
git clean -fx node_modules
git clean -fx _book

# Git ADD
git add .
git commit -a -m "Update docs"

# Push & checkout
git push origin gh-pages
git checkout main
