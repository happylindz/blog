import { utilA } from './utilA';
import { utilB, funcB } from './utilB';

funcB();
import('./utilC').then(function(utilC) {
  console.log(utilC);
})