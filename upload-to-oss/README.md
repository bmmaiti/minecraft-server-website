# 上传 logo 到阿里云 OSS

## 安装依赖

```bash
npm install
```

## 配置环境变量

```bash
export ACCESS_KEY_ID=your_access_key_id
export ACCESS_KEY_SECRET=your_access_key_secret
```

## 运行脚本

```bash
node upload-to-oss.js
```

## 在函数计算中使用

修改 `index.js` 中的 `downloadFile` 函数，添加 OSS 上传逻辑：

```javascript
// 下载完成后上传到 OSS
await client.put(`logos/${fileName}`, filePath);
```
