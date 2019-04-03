// 这里的获取exif要将图片转ArrayBuffer对象，这里假设获取了图片的baes64
// 步骤一
// base64转ArrayBuffer对象
function base64ToArrayBuffer(base64) {
  // base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
  const base64Content = base64.split(',')[1]
  const binary = atob(base64Content)
  const len = binary.length
  const buffer = new ArrayBuffer(len)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < len; i += 1) {
    view[i] = binary.charCodeAt(i)
  }
  return buffer
}
async function getImageBlob(url) {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest()
    xhr.onload = () => {
      res(xhr.response)
    }
    xhr.onerror = rej
    xhr.open('GET', url, true)
    xhr.responseType = 'blob'
    xhr.send()
  })
}
async function blobToBase64(blob) {
  console.log(blob)
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = e => {
      console.log(e)
      res(e.target.result)
      // $('#imgshow').get(0).src = e.target.result;
    }
    reader.readAsDataURL(blob)
  })
}
async function urlToArrayBuffer(url) {
  // base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
  try {
    const blob = await getImageBlob(url)
    const base64 = await blobToBase64(blob)
    console.log(base64)
    const base64Content = base64.split(',')[1]
    const binary = atob(base64Content)
    const len = binary.length
    const buffer = new ArrayBuffer(len)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < len; i += 1) {
      view[i] = binary.charCodeAt(i)
    }
    return buffer
  } catch (e) {
    console.log(e)
  }
}
// 步骤二，Unicode码转字符串
// ArrayBuffer对象 Unicode码转字符串
function getStringFromCharCode(dataView, start, length) {
  let str = ''
  let i
  for (i = start, length += start; i < length; i += 1) {
    str += String.fromCharCode(dataView.getUint8(i))
  }
  return str
}

// 步骤三，获取jpg图片的exif的角度（在ios体现最明显）
function getOrientation(arrayBuffer) {
  const dataView = new DataView(arrayBuffer)
  let length = dataView.byteLength
  let exifIDCode = 0
  let tiffOffset = 0
  let firstIFDOffset = 0
  let littleEndian = 0
  let endianness = 0
  let app1Start = 0
  let ifdStart = 0
  let orientation = 0
  let offset = 0
  let i = 0
  // Only handle JPEG image (start by 0xFFD8)
  if (dataView.getUint8(0) === 0xFF && dataView.getUint8(1) === 0xD8) {
    offset = 2
    while (offset < length) {
      if (dataView.getUint8(offset) === 0xFF && dataView.getUint8(offset + 1) === 0xE1) {
        app1Start = offset
        break
      }
      offset += 1
    }
  }
  if (app1Start) {
    exifIDCode = app1Start + 4
    tiffOffset = app1Start + 10
    if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
      endianness = dataView.getUint16(tiffOffset)
      littleEndian = endianness === 0x4949
      if (littleEndian || endianness === 0x4D4D/* bigEndian */) {
        if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002A) {
          firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian)
          if (firstIFDOffset >= 0x00000008) {
            ifdStart = tiffOffset + firstIFDOffset
          }
        }
      }
    }
  }
  if (ifdStart) {
    length = dataView.getUint16(ifdStart, littleEndian)
    for (i = 0; i < length; i += 1) {
      offset = ifdStart + (i * 12) + 2
      if (dataView.getUint16(offset, littleEndian) === 0x0112/* Orientation */) {
        // 8 is the offset of the current tag's value
        offset += 8
        // Get the original orientation value
        orientation = dataView.getUint16(offset, littleEndian)
        // Override the orientation with its default value for Safari (#120)
        // if (IS_SAFARI_OR_UIWEBVIEW) {
        //   dataView.setUint16(offset, 1, littleEndian);
        // }
        break
      }
    }
  }
  return orientation
}
export default async function getOriginRotate(base64) {
  // const buffer = base64ToArrayBuffer(base64)

  try {
    const map = {
      0: 0,
      1: 0,
      3: 180,
      6: 90,
      8: 270,
    }
    if (base64.indexOf('data:') === 0) {
      return map[getOrientation(base64ToArrayBuffer(base64))] || 0
    }
    return map[getOrientation(await urlToArrayBuffer(base64))] || 0
  } catch (e) {
    console.log(e)
    return 0
  }
}
