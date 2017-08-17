import {h} from 'hyperapp';

const Main = ({state, actions}) =>
  <div>
    <h1>{state.title}</h1>
  </div>

export default (state, actions) =>
  <Main state={state} actions={actions} /> 
