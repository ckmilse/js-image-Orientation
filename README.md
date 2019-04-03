# js-image-Orientation
原理参考链接：
https://www.jianshu.com/p/eb855b580780
代码有参考某个博客，只是链接已丢失

参数 base64字符串 或者 远程url


```
npm i js-image-orientation --save

import getOriginRotate from 'js-image-orientation'

//todo  if cosnt base64 = 'data:image/jpg;base64,iVBORw0KGgoAAAANSUhE....'
const orientation = (1) * (await getOriginRotate(base64))
//we can get orientation
//返回值为 promise ,使用async 方便获取参数
返回  const map = {
      0: 0,
      1: 0,
      3: 180,
      6: 90,
      8: 270,
    }
```
