import mqtt from 'mqtt'

/**
 * 创建 MQTT 客户端
 * @param {string} deviceId - 设备 ID
 * @returns {object} MQTT 客户端实例
 */
export function createClient (deviceId) {
  const host = process.env.VUE_APP_MQTT_BROKER_URL || ''

  // 用户名和密码配置
  const username = process.env.VUE_APP_MQTT_USERNAME || '' // 用户名
  const password = process.env.VUE_APP_MQTT_PASSWORD || '' // 密码

// 确保 clientId 的长度不超过 23 个字符
  const randomPart = Math.random().toString(16).substr(2, 8) // 随机生成部分，确保长度适中
  const maxLength = 23 - randomPart.length - 1 // 设备 ID 可用的最大长度
  const truncatedDeviceId = deviceId.substr(0, maxLength) // 截断设备 ID 以适应限制
  const clientId = `mqtt_${randomPart}_${truncatedDeviceId}`
  console.log('客户端ID，随机生成并拼接设备ID', clientId)
  const options = {
    keepalive: 30, // 保持连接的时间间隔（秒）
    clientId: clientId, // 客户端ID，随机生成并拼接设备ID
    protocolId: 'MQTT', // 协议ID
    protocolVersion: 5, // 协议版本
    clean: true, // 断开后清除会话
    reconnectPeriod: 1000, // 重连时间间隔（毫秒）
    connectTimeout: 30 * 1000, // 连接超时时间（毫秒）
    username: username, // 添加用户名
    password: password, // 添加密码
    will: {
      topic: 'WillMsg', // 遗嘱消息主题
      payload: 'Connection Closed abnormally..!', // 遗嘱消息内容
      qos: 0, // 服务质量
      retain: false // 是否保留消息
    },
    rejectUnauthorized: false // 是否拒绝未经授权的服务器证书
  }

  const client = mqtt.connect(host, options)

  client.on('connect', () => {
    console.log('Connected to MQTT broker')
  })

  client.on('error', (err) => {
    console.error('Connection error: ', err)
    client.end()
  })

  client.on('reconnect', () => {
    console.log('Reconnecting...')
  })

  return client
}

/**
 * 订阅主题并处理消息
 * @param {object} client - MQTT 客户端实例
 * @param {string} topic - 主题名称
 * @param {function} callback - 处理消息的回调函数
 */
export function subscribe (client, topic, callback) {
  client.subscribe(topic, (err) => {
    if (err) {
      console.error(`Subscribe error: ${err}`)
      return
    }
    console.log(`Subscribed to ${topic}`)
  })

  client.on('message', (receivedTopic, message) => {
    if (receivedTopic === topic) {
      callback(message.toString())
    }
  })
}

/**
 * 发布消息到指定主题
 * @param {object} client - MQTT 客户端实例
 * @param {string} topic - 主题名称
 * @param {string} message - 消息内容
 */
export function publish (client, topic, message) {
  client.publish(topic, message, (err) => {
    if (err) {
      console.error(`Publish error: ${err}`)
    } else {
      console.log(`Message published to ${topic}`)
    }
  })
}
