# Usage

```bash
yarn install
npm install -g taskr
taskr watch
// http://localhost:4001/
```

## HyperApp Browser

`src/index.js`

## Static HyperApp JSX

Add files to src/jsx/

`src/jsx/home.jsx` -> `dist/home.html` -> `http://localhost:4001/home.html`

You can add data files too.

`src/jsx/default.json` for all data defaults of all src/jsx/*.jsx

Add a custom file for each jsx by just adding the same filename with the file extension replaced.  For example `home.jsx` will use `home.json`