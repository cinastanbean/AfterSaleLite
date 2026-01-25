/**
 * PaymentTool - 支付相关工具
 * 用于价格保护申请、退款处理等
 */

class PaymentTool {
  constructor() {
    this.name = 'payment_operation';
    this.description = '处理支付相关操作，包括价格保护申请、退款查询、退款进度查询等';
    this.parameters = {
      orderId: '订单号（字符串），必需参数',
      userId: '用户ID（字符串），必需参数',
      action: '操作类型（字符串）：price_protect(价格保护), query_refund(查询退款), refund_status(退款状态)',
      currentPrice: '当前商品价格（数字），价格保护时必需'
    };
  }

  /**
   * 执行支付操作
   * @param {Object} params - {orderId, userId, action, currentPrice}
   * @returns {Promise<Object>} - 执行结果
   */
  async execute(params) {
    const { orderId, userId, action = 'query_refund', currentPrice } = params;

    if (!orderId || !userId) {
      throw new Error('订单号和用户ID都是必需参数');
    }

    switch (action) {
      case 'price_protect':
        return this.applyPriceProtection({ orderId, userId, currentPrice });
      case 'query_refund':
        return this.queryRefund(orderId, userId);
      case 'refund_status':
        return this.queryRefundStatus(orderId, userId);
      default:
        return {
          success: false,
          message: `不支持的操作类型: ${action}`
        };
    }
  }

  /**
   * 申请价格保护
   * @param {Object} params - {orderId, userId, currentPrice}
   * @returns {Object} - 价格保护结果
   */
  applyPriceProtection({ orderId, userId, currentPrice }) {
    if (!currentPrice) {
      return {
        success: false,
        message: '请提供当前商品价格'
      };
    }

    const order = this.getMockOrder(orderId, userId);
    if (!order) {
      return {
        success: false,
        message: `订单 ${orderId} 不存在`
      };
    }

    // 检查订单状态
    if (order.status !== '已完成') {
      return {
        success: false,
        message: `订单状态为 ${order.status}，不适用价格保护政策`
      };
    }

    // 计算价格差
    const priceDiff = order.totalAmount - parseFloat(currentPrice);

    if (priceDiff <= 0) {
      return {
        success: false,
        message: `当前价格 ${currentPrice} 元不低于订单价格 ${order.totalAmount} 元，无需价格保护`
      };
    }

    // 检查是否在价格保护期内（30天）
    const orderDate = new Date(order.orderTime);
    const now = new Date();
    const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);

    if (diffDays > 30) {
      return {
        success: false,
        message: `订单已超过30天价格保护期（下单时间：${order.orderTime}）`
      };
    }

    // 创建价格保护申请
    const protectId = `PP${Date.now()}`;
    const protectOrder = {
      protectId,
      orderId,
      userId,
      originalPrice: order.totalAmount,
      currentPrice: parseFloat(currentPrice),
      refundAmount: priceDiff,
      status: '审核通过',
      createTime: new Date().toISOString(),
      refundMethod: order.paymentMethod
    };

    return {
      success: true,
      message: `价格保护申请已通过，将退还差价 ${priceDiff.toFixed(2)} 元`,
      protectOrder
    };
  }

  /**
   * 查询退款信息
   * @param {string} orderId - 订单号
   * @param {string} userId - 用户ID
   * @returns {Object} - 退款信息
   */
  queryRefund(orderId, userId) {
    const order = this.getMockOrder(orderId, userId);
    if (!order) {
      return {
        success: false,
        message: `订单 ${orderId} 不存在`
      };
    }

    const refunds = this.getMockRefunds(userId);
    const refund = refunds.find(r => r.orderId === orderId);

    if (!refund) {
      return {
        success: true,
        message: '该订单暂无退款记录',
        refunds: []
      };
    }

    return {
      success: true,
      refunds: [refund]
    };
  }

  /**
   * 查询退款状态
   * @param {string} orderId - 订单号
   * @param {string} userId - 用户ID
   * @returns {Object} - 退款状态
   */
  queryRefundStatus(orderId, userId) {
    const refunds = this.getMockRefunds(userId);
    const refund = refunds.find(r => r.orderId === orderId);

    if (!refund) {
      return {
        success: false,
        message: '未找到该订单的退款记录'
      };
    }

    return {
      success: true,
      refund
    };
  }

  /**
   * 获取模拟订单
   * @param {string} orderId - 订单号
   * @param {string} userId - 用户ID
   * @returns {Object|null} - 订单信息
   */
  getMockOrder(orderId, userId) {
    return {
      orderId,
      userId,
      status: '已完成',
      totalAmount: 299.00,
      paymentMethod: '微信支付',
      orderTime: '2024-01-15 10:30:00',
      completedTime: '2024-01-16 14:30:00'
    };
  }

  /**
   * 获取模拟退款记录
   * @param {string} userId - 用户ID
   * @returns {Array} - 退款记录列表
   */
  getMockRefunds(userId) {
    return [
      {
        refundId: 'REF202401170001',
        orderId: 'ORD20240115001',
        userId,
        refundAmount: 50.00,
        reason: '价格保护',
        status: '退款成功',
        refundMethod: '原路退回',
        applyTime: '2024-01-17 10:00:00',
        completeTime: '2024-01-17 14:00:00',
        remark: '30天内价格保护政策'
      },
      {
        refundId: 'REF202401160002',
        orderId: 'ORD20240114002',
        userId,
        refundAmount: 599.00,
        reason: '退货退款',
        status: '退款中',
        refundMethod: '原路退回',
        applyTime: '2024-01-16 15:00:00',
        remark: '商品有质量问题'
      }
    ];
  }
}

module.exports = { PaymentTool };
