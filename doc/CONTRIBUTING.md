# 贡献指南

感谢你对本项目的关注！欢迎提交 Issue 和 Pull Request。

## 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议，请：

1. 检查 [Issues](../../issues) 是否已有类似的问题
2. 如果没有，创建新的 Issue，包含：
   - 清晰的标题
   - 详细的问题描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（操作系统、Node.js 版本等）

### 提交代码

1. **Fork 本仓库**
2. **创建你的特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交你的修改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 代码规范

- 遵循现有的代码风格
- 添加必要的注释
- 确保代码没有语法错误
- 更新相关文档

### 提交信息规范

提交信息应该清晰描述你的修改：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 构建/工具链相关
```

## 开发指南

### 环境准备

```bash
# 安装依赖
cd server && npm install
cd ../client && npm install
cd ..

# 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env，填入你的 API Key
```

### 运行项目

```bash
# 启动后端
cd server && npm start

# 启动前端
cd client && npm run dev
```

### 项目结构

```
├── client/              # 前端项目（React + TypeScript）
├── server/              # 后端项目（Node.js + Express）
├── embedding-service/   # Embedding 服务（Python）
└── 电商知识库/           # 示例知识库文档
```

### 添加新功能

1. 在 `server/src/services/` 中添加新服务
2. 在 `client/src/pages/` 中添加新页面
3. 更新相关文档
4. 添加测试

## 文档贡献

如果你发现文档有错误或不清楚的地方，欢迎：

1. 直接修改文档文件
2. 提交 Pull Request
3. 在 Issue 中说明需要改进的地方

## 行为准则

- 尊重所有贡献者
- 保持友好和专业的交流
- 关注问题本身，而不是个人
- 接受建设性的批评

## 获取帮助

如果你有疑问，可以：

1. 查看 [README](README.md) 和 [QUICKSTART](QUICKSTART.md)
2. 浏览现有的 [Issues](../../issues)
3. 创建新的 Issue 寻求帮助

## 许可证

通过贡献代码，你同意你的代码将在 [MIT License](LICENSE) 下发布。

---

再次感谢你的贡献！
