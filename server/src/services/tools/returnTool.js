/**
 * ReturnTool - 退货处理工具
 * 用于处理退货申请、退货审核等
 */

class ReturnTool {
  constructor() {
    this.name = 'process_return';
    this.description = '处理用户的退货申请，包括创建退货单、检查退货资格、查询退货进度等';
    this.parameters = {
      orderId: '订单号（字符串），创建退货时必需',
      userId: '用户ID（字符串），必需参数',
      action: '操作类型（字符串）：create(创建退货), query(查询退货进度), cancel(取消退货)',
      reason: '退货原因（字符串），创建退货时必需',
      refundMethod: '退款方式（字符串）：原路退回、账户余额等，创建退货时可选'
    };
  }

  /**
   * 执行退货处理
   * @param {Object} params - {orderId, userId, action, reason, refundMethod}
   * @returns {Promise<Object>} - 处理结果
   */
  async execute(params) {
    const { orderId, userId, action = 'query', reason, refundMethod } = params;

    if (!userId) {
      throw new Error('用户ID是必需参数');
    }

    switch (action) {
      case 'create':
        return this.createReturn({ orderId, userId, reason, refundMethod });
      case 'query':
        return this.queryReturnStatus(orderId, userId);
      case 'cancel':
        return this.cancelReturn(orderId, userId);
      default:
        return {
          success: false,
          message: `不支持的操作类型: ${action}`
        };
    }
  }

  /**
   * 创建退货申请
   * @param {Object} params - {orderId, userId, reason, refundMethod}
   * @returns {Object} - 退货结果
   */
  createReturn({ orderId, userId, reason, refundMethod }) {
    if (!orderId || !reason) {
      return {
        success: false,
        message: '订单号和退货原因是必需参数'
      };
    }

    // 检查订单是否存在
    const order = this.getMockOrder(orderId, userId);
    if (!order) {
      return {
        success: false,
        message: `订单 ${orderId} 不存在或已完成超过7天，无法退货`
      };
    }

    // 检查是否在7天退货期内
    const orderDate = new Date(order.orderTime);
    const now = new Date();
    const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      return {
        success: false,
        message: `订单已超过7天退货期（下单时间：${order.orderTime}），无法退货`
      };
    }

    // 检查订单状态
    if (order.status === '待付款' || order.status === '已取消') {
      return {
        success: false,
        message: `订单状态为 ${order.status}，无法退货`
      };
    }

    // 创建退货单
    const returnId = `RTN${Date.now()}`;
    const returnOrder = {
      returnId,
      orderId,
      userId,
      reason,
      refundMethod: refundMethod || '原路退回',
      status: '待审核',
      createTime: new Date().toISOString(),
      products: order.products,
      refundAmount: order.totalAmount
    };

    return {
      success: true,
      message: '退货申请已提交，等待商家审核',
      returnOrder
    };
  }

  /**
   * 查询退货进度
   * @param {string} orderId - 订单号
   * @param {string} userId - 用户ID
   * @returns {Object} - 退货进度
   */
  queryReturnStatus(orderId, userId) {
    // 模拟查询退货进度
    const mockReturns = this.getMockReturns(userId);
    const returnOrder = mockReturns.find(r => r.orderId === orderId);

    if (!returnOrder) {
      return {
        success: false,
        message: '未找到该订单的退货记录'
      };
    }

    return {
      success: true,
      returnOrder
    };
  }

  /**
   * 取消退货
   * @param {string} orderId - 订单号
   * @param {string} userId - 用户ID
   * @returns {Object} - 取消结果
   */
  cancelReturn(orderId, userId) {
    const mockReturns = this.getMockReturns(userId);
    const returnOrder = mockReturns.find(r => r.orderId === orderId);

    if (!returnOrder) {
      return {
        success: false,
        message: '未找到该订单的退货记录'
      };
    }

    if (returnOrder.status !== '待审核') {
      return {
        success: false,
        message: `退货状态为 ${returnOrder.status}，无法取消`
      };
    }

    return {
      success: true,
      message: '退货申请已取消'
    };
  }

  /**
   * 获取模拟订单
   * @param {string} orderId - 订单号
   * @param {string} userId - 用户ID
   * @returns {Object|null} - 订单信息
   */
  getMockOrder(orderId, userId) {
    // 简单模拟，实际应该查询订单系统
    return {
      orderId,
      userId,
      status: '已发货',
      orderTime: '2024-01-15 10:30:00',
      totalAmount: 299.00,
      products: [
        {
          name: '智能蓝牙耳机',
          quantity: 1,
          price: 299.00
        }
      ]
    };
  }

  /**
   * 获取模拟退货记录
   * @param {string} userId - 用户ID
   * @returns {Array} - 退货记录列表
   */
  getMockReturns(userId) {
    return [
      {
        returnId: 'RTN202401160001',
        orderId: 'ORD20240115001',
        userId,
        reason: '商品有质量问题',
        refundMethod: '原路退回',
        status: '审核通过',
        createTime: '2024-01-16 10:00:00',
        refundAmount: 299.00,
        auditTime: '2024-01-16 15:00:00',
        refundTime: '2024-01-17 10:00:00'
      },
      {
        returnId: 'RTN202401160002',
        orderId: 'ORD20240112003',
        userId,
        reason: '不想要了',
        refundMethod: '账户余额',
        status: '待审核',
        createTime: '2024-01-16 14:00:00',
        refundAmount: 1299.00
      }
    ];
  }
}

module.exports = { ReturnTool };
