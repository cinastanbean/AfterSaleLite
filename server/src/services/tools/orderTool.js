/**
 * OrderTool - 订单管理工具
 * 用于查询订单信息、订单状态等
 */

class OrderTool {
  constructor() {
    this.name = 'query_order';
    this.description = '查询用户的订单信息，包括订单状态、商品详情、下单时间等';
    this.parameters = {
      orderId: '订单号（字符串），如果未提供则查询用户所有订单',
      userId: '用户ID（字符串），必需参数'
    };
  }

  /**
   * 执行订单查询
   * @param {Object} params - {orderId, userId}
   * @returns {Promise<Object>} - 订单信息
   */
  async execute(params) {
    const { orderId, userId } = params;

    if (!userId) {
      throw new Error('用户ID是必需参数');
    }

    // 模拟订单数据（实际应该从订单系统API获取）
    const mockOrders = this.getMockOrders(userId);

    if (orderId) {
      const order = mockOrders.find(o => o.orderId === orderId);
      if (!order) {
        return {
          success: false,
          message: `订单 ${orderId} 不存在或不属于该用户`
        };
      }
      return {
        success: true,
        order: order
      };
    } else {
      return {
        success: true,
        orders: mockOrders,
        total: mockOrders.length
      };
    }
  }

  /**
   * 获取模拟订单数据
   * @param {string} userId - 用户ID
   * @returns {Array} - 订单列表
   */
  getMockOrders(userId) {
    return [
      {
        orderId: 'ORD20240115001',
        userId: userId,
        status: '已发货',
        statusDesc: '商品已出库，等待收货',
        totalAmount: 299.00,
        paymentMethod: '微信支付',
        orderTime: '2024-01-15 10:30:00',
        products: [
          {
            name: '智能蓝牙耳机',
            sku: 'BT001',
            price: 299.00,
            quantity: 1
          }
        ],
        address: {
          receiver: '张三',
          phone: '138****1234',
          address: '北京市朝阳区XX路XX号'
        },
        logistics: {
          company: '顺丰速运',
          trackingNumber: 'SF1234567890',
          estimatedDelivery: '2024-01-17'
        }
      },
      {
        orderId: 'ORD20240114002',
        userId: userId,
        status: '已完成',
        statusDesc: '订单已完成',
        totalAmount: 599.00,
        paymentMethod: '支付宝',
        orderTime: '2024-01-14 15:20:00',
        products: [
          {
            name: '智能手表 Pro',
            sku: 'WATCH001',
            price: 599.00,
            quantity: 1
          }
        ],
        address: {
          receiver: '张三',
          phone: '138****1234',
          address: '北京市朝阳区XX路XX号'
        },
        completedTime: '2024-01-16 10:00:00'
      },
      {
        orderId: 'ORD20240112003',
        userId: userId,
        status: '待付款',
        statusDesc: '订单已创建，请在30分钟内完成支付',
        totalAmount: 1299.00,
        paymentMethod: null,
        orderTime: '2024-01-12 09:15:00',
        products: [
          {
            name: '笔记本电脑 15.6寸',
            sku: 'LAPTOP001',
            price: 1299.00,
            quantity: 1
          }
        ],
        expireTime: '2024-01-12 09:45:00'
      }
    ];
  }
}

module.exports = { OrderTool };
