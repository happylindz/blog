import componentA from './common/componentA';
import componentB from './common/componentB';
import './css/common.css'
import './css/pageB.css';

console.log(componentA);
console.log(componentB);
document.getElementById('xxxxx').addEventListener('click', () => {
  import( /* webpackChunkName: "async" */
    './common/asyncComponent.js').then((async) => {
      async();
  })
})
