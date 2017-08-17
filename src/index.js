import {h, app} from 'hyperapp';

const Main = ({state, actions}) =>
  <div>
    <h1>{state.title}</h1>
  </div>

app({
    state: {title: 'Hello World'},
    view: (state, actions) =>
        <Main state={state} actions={actions}/>
});
