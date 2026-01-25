/**
 * TaskPlanner - 任务规划器
 * 将复杂任务分解为多个步骤并执行
 */

class TaskPlanner {
  constructor(toolManager) {
    this.toolManager = toolManager;
    // 定义任务模板
    this.taskTemplates = {
      // 订单投诉处理
      'order_complaint': {
        description: '处理订单投诉',
        steps: [
          {
            tool: 'query_order',
            description: '查询订单信息',
            extractParams: (params) => ({
              orderId: params.orderId,
              userId: params.userId
            })
          },
          {
            tool: 'query_logistics',
            description: '查询物流信息',
            extractParams: (params) => ({
              orderId: params.orderId,
              userId: params.userId
            }),
            condition: (prevResult) => {
              return prevResult.order && ['已发货', '运输中'].includes(prevResult.order.status);
            }
          },
          {
            action: 'escalate',
            description: '转接人工客服处理投诉',
            message: '已收集订单和物流信息，正在为您转接人工客服处理...'
          }
        ]
      },
      // 退货流程
      'return_process': {
        description: '处理退货流程',
        steps: [
          {
            tool: 'query_order',
            description: '查询订单信息',
            extractParams: (params) => ({
              orderId: params.orderId,
              userId: params.userId
            })
          },
          {
            tool: 'process_return',
            description: '创建退货申请',
            extractParams: (params) => ({
              orderId: params.orderId,
              userId: params.userId,
              action: 'create',
              reason: params.reason || '用户未提供原因'
            }),
            condition: (prevResult) => {
              return prevResult.order && prevResult.order.status !== '待付款';
            }
          }
        ]
      },
      // 价格保护申请
      'price_protection': {
        description: '处理价格保护申请',
        steps: [
          {
            tool: 'query_order',
            description: '查询订单信息',
            extractParams: (params) => ({
              orderId: params.orderId,
              userId: params.userId
            })
          },
          {
            tool: 'payment_operation',
            description: '申请价格保护',
            extractParams: (params) => ({
              orderId: params.orderId,
              userId: params.userId,
              action: 'price_protect',
              currentPrice: params.currentPrice
            })
          }
        ]
      },
      // 物流异常处理
      'logistics_issue': {
        description: '处理物流异常',
        steps: [
          {
            tool: 'query_logistics',
            description: '查询物流信息',
            extractParams: (params) => ({
              orderId: params.orderId,
              userId: params.userId
            })
          },
          {
            action: 'escalate',
            description: '转接人工客服',
            message: (prevResult) => {
              if (prevResult.anomalies && prevResult.anomalies.length > 0) {
                return `检测到物流异常：${prevResult.anomalies.map(a => a.description).join('；')}，正在为您转接人工客服处理...`;
              }
              return '正在为您转接人工客服处理物流问题...';
            }
          }
        ]
      }
    };
  }

  /**
   * 识别任务类型
   * @param {Object} params - 参数对象
   * @param {string} userMessage - 用户消息
   * @returns {string|null} - 任务类型
   */
  identifyTaskType(params, userMessage = '') {
    const message = userMessage.toLowerCase();

    // 基于关键词识别任务类型
    if (message.includes('投诉') || message.includes('问题') || message.includes('不满意')) {
      return 'order_complaint';
    }
    if (message.includes('退货') || message.includes('退换货')) {
      return 'return_process';
    }
    if (message.includes('降价') || message.includes('价格保护') || message.includes('差价')) {
      return 'price_protection';
    }
    if (message.includes('物流') || message.includes('快递') || message.includes('配送') || message.includes('没收到')) {
      return 'logistics_issue';
    }

    // 根据参数判断
    if (params.reason) {
      return 'return_process';
    }
    if (params.currentPrice) {
      return 'price_protection';
    }

    return null;
  }

  /**
   * 执行任务计划
   * @param {string} taskType - 任务类型
   * @param {Object} params - 参数对象
   * @returns {Promise<Object>} - 执行结果
   */
  async executeTask(taskType, params) {
    const template = this.taskTemplates[taskType];
    if (!template) {
      throw new Error(`未知的任务类型: ${taskType}`);
    }

    console.log(`\n📋 开始执行任务: ${template.description}`);

    const results = [];
    const context = {};

    for (let i = 0; i < template.steps.length; i++) {
      const step = template.steps[i];
      console.log(`  步骤 ${i + 1}/${template.steps.length}: ${step.description}`);

      try {
        let result;

        if (step.action === 'escalate') {
          // 人工转接
          const message = typeof step.message === 'function'
            ? step.message(context)
            : step.message;
          result = {
            type: 'escalate',
            message
          };
        } else {
          // 检查条件
          if (step.condition) {
            const shouldExecute = step.condition(context);
            if (!shouldExecute) {
              console.log(`    ⏭️  步骤条件不满足，跳过`);
              continue;
            }
          }

          // 提取参数并执行工具
          const toolParams = step.extractParams(params);
          result = await this.toolManager.executeTool(step.tool, toolParams);
        }

        results.push({
          step: step.description,
          result
        });

        // 更新上下文
        if (result.order) context.order = result.order;
        if (result.logistics) context.logistics = result.logistics;
        if (result.anomalies) context.anomalies = result.anomalies;

        console.log(`    ✅ 步骤完成`);

      } catch (error) {
        console.error(`    ❌ 步骤失败:`, error.message);
        results.push({
          step: step.description,
          result: { success: false, error: error.message }
        });
      }
    }

    console.log(`📋 任务执行完成\n`);

    return {
      taskType,
      description: template.description,
      steps: results,
      success: results.every(r => r.result.success !== false && r.result.type !== 'error')
    };
  }

  /**
   * 生成任务执行报告
   * @param {Object} executionResult - 执行结果
   * @returns {string} - 文本报告
   */
  generateReport(executionResult) {
    let report = `已为您执行任务：${executionResult.description}\n\n`;

    executionResult.steps.forEach((step, index) => {
      report += `${index + 1}. ${step.step}\n`;

      if (step.result.type === 'escalate') {
        report += `   ${step.result.message}\n`;
      } else if (step.result.success) {
        report += `   ✅ 完成\n`;
        if (step.result.order) {
          report += `   订单状态：${step.result.order.status}\n`;
        }
        if (step.result.logistics) {
          report += `   物流状态：${step.result.logistics.currentStatus}\n`;
        }
        if (step.result.message) {
          report += `   ${step.result.message}\n`;
        }
      } else {
        report += `   ❌ 失败：${step.result.error || step.result.message}\n`;
      }
      report += '\n';
    });

    return report;
  }
}

module.exports = { TaskPlanner };
