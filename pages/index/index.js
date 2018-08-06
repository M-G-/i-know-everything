//index.js
//获取应用实例
const upng = require('./UPNG/UPNG.js')
const {formatName, formatScore} = require('../../utils/util.js')
const app = getApp()
const AIToken = '24.9774a5c447e745396f62c8733c6bd957.2592000.1534497939.282335-11553027'
const API = {
  common: `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=${AIToken}`,
  car: `https://aip.baidubce.com/rest/2.0/image-classify/v1/car?access_token=${AIToken}`
}

// 通用接口结果示例：
// let result = [{ "score": 0.47904, "root": "商品-文具", "keyword": "卷笔刀" }, { "score": 0.368126, "root": "商品-电脑办公", "keyword": "圆珠笔" }, { "score": 0.243069, "root": "商品-电脑办公", "keyword": "钢笔" }, { "score": 0.121243, "root": "商品-文具", "keyword": "弹簧笔" }, { "score": 0.009231, "root": "商品-文具", "keyword": "笔" }]

Page({
  data: {
    img: '',
    imgWidth: 0,
    imgHeight: 0,
    result: null,
    name: '',
    loading: false,
    type: '',
    status: 0,
    statusTxt: ['', '//正在获取图片信息...', '//正在分析图片...', '//正在识别图片...', ''],
    statusProgress: [0, 10, 65, 95, 100]
  },
  //事件处理函数
  bindChoose: function(e) {
    let { type } = e.target.dataset
    console.log('识别类型：' + type)
    
    wx.chooseImage({
      count: 1,
      success: (data) => {
        this.setData({
          data: '',
          result: null,
          imgWidth: 0,
          imgHeight: 0,
          type
        })
        
        console.log(data.tempFilePaths[0])
        this.getImageInfo(data.tempFilePaths[0])
      }
    })
  },
  getImageInfo: function(src) {
    this.setData({ loading: true, status: 1})
    wx.getImageInfo({
      src,
      success: (data) => {
        console.log(data)
        let {width, height} = data
        // let max = Math.max(360, Math.min(width, height))
        let max = 500
        let vertical = width < height
        let t = (vertical ? width : height) / max

        this.setData({
          img: src,
          imgWidth: vertical ? max : parseInt(width / t),
          imgHeight: vertical ? parseInt(height / t) : max,
        }, () => {
          this.getBase64Image(src)
        })
      }
    })
  },
  getBase64Image: function (img) {
    this.setData({ status: 2 })

    const { imgWidth, imgHeight } = this.data
    const ctx = wx.createCanvasContext('myCanvas')
    ctx.drawImage(img, 0, 0, imgWidth, imgHeight)

    ctx.draw(false, () => {
      // 2. 获取图像数据
      wx.canvasGetImageData({
        canvasId: 'myCanvas',
        x: 0,
        y: 0,
        width: imgWidth,
        height: imgHeight,
        success: (res) => {
          console.log(res)
          // 3. png编码
          let pngData = upng.encode([res.data.buffer], res.width, res.height)
          // 4. base64编码
          let base64 = wx.arrayBufferToBase64(pngData)

          this.getResult(base64)
        },
        fail: (e) => {
          console.log(e)
        }
      })
    })
  },
  getResult: function (base64){
    this.setData({ status: 3 })

    wx.request({
      url: API[this.data.type],
      method: 'POST',
      header: {'content-type': 'application/x-www-form-urlencoded'},
      data: {image: base64},
      success: (data) => {
        const {result} = data.data
        console.log(result)

        this.setData({
          result,
          name: formatName[this.data.type](result[0]),
          loading: false,
          status: 4
        })
      },
      fail: function (data) {
        console.log(data)
      }
    })
  },
  bindShowDetail: function () {
    wx.showActionSheet({
      itemList: this.data.result.map((item) => 
        `${formatName[this.data.type](item)} (${formatScore(item.score)})`
      )
    })
  }
})
