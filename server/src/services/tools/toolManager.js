/**
 * ToolManager - 工具管理器
 * 负责注册、管理和执行所有工具
 */

class ToolManager {
  constructor() {
    this.tools = new Map(); // 存储所有工具
  }

  /**
   * 注册工具
   * @param {Object} tool - 工具对象 {name, description, parameters, execute}
   */
  registerTool(tool) {
    if (!tool.name || !tool.execute) {
      throw new Error('工具必须有 name 和 execute 方法');
    }
    this.tools.set(tool.name, tool);
    console.log(`✅ 工具已注册: ${tool.name}`);
  }

  /**
   * 获取所有工具列表
   * @returns {Array} - 工具列表
   */
  getTools() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  /**
   * 根据名称获取工具
   * @param {string} toolName - 工具名称
   * @returns {Object|null} - 工具对象
   */
  getTool(toolName) {
    return this.tools.get(toolName) || null;
  }

  /**
   * 执行工具
   * @param {string} toolName - 工具名称
   * @param {Object} params - 参数对象
   * @returns {Promise<Object>} - 执行结果
   */
  async executeTool(toolName, params = {}) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`工具不存在: ${toolName}`);
    }

    try {
      console.log(`🔧 执行工具: ${toolName}`, params);
      const result = await tool.execute(params);
      console.log(`✅ 工具执行完成: ${toolName}`);
      return result;
    } catch (error) {
      console.error(`❌ 工具执行失败: ${toolName}`, error);
      throw error;
    }
  }

  /**
   * 获取工具列表用于LLM
   * @returns {string} - 格式化的工具描述
   */
  getToolsDescription() {
    const descriptions = [];
    for (const tool of this.tools.values()) {
      descriptions.push(`- ${tool.name}: ${tool.description}`);
      if (tool.parameters) {
        const params = Object.entries(tool.parameters)
          .map(([key, desc]) => `  - ${key}: ${desc}`)
          .join('\n');
        descriptions.push(params);
      }
    }
    return descriptions.join('\n');
  }
}

module.exports = { ToolManager };
