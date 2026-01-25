/**
 * LogisticsTool - 物流查询工具
 * 用于查询物流信息、检测异常等
 */

class LogisticsTool {
  constructor() {
    this.name = 'query_logistics';
    this.description = '查询订单的物流轨迹信息，包括发货、运输、派送等状态，可以检测物流异常';
    this.parameters = {
      orderId: '订单号（字符串），必需参数',
      userId: '用户ID（字符串），必需参数'
    };
  }

  /**
   * 执行物流查询
   * @param {Object} params - {orderId, userId}
   * @returns {Promise<Object>} - 物流信息
   */
  async execute(params) {
    const { orderId, userId } = params;

    if (!orderId || !userId) {
      throw new Error('订单号和用户ID都是必需参数');
    }

    // 模拟物流数据
    const logisticsData = this.getMockLogistics(orderId, userId);

    if (!logisticsData) {
      return {
        success: false,
        message: '未找到该订单的物流信息'
      };
    }

    // 检测物流异常
    const anomalies = this.detectAnomalies(logisticsData);

    return {
      success: true,
      logistics: logisticsData,
      anomalies: anomalies,
      status: anomalies.length > 0 ? '异常' : '正常'
    };
  }

  /**
   * 获取模拟物流数据
   * @param {string} orderId - 订单号
   * @param {string} userId - 用户ID
   * @returns {Object|null} - 物流信息
   */
  getMockLogistics(orderId, userId) {
    const mockData = {
      'ORD20240115001': {
        orderId: 'ORD20240115001',
        userId: userId,
        company: '顺丰速运',
        trackingNumber: 'SF1234567890',
        currentStatus: '运输中',
        estimatedDelivery: '2024-01-17',
        routes: [
          {
            status: '已揽收',
            location: '北京市朝阳区',
            time: '2024-01-15 10:30:00',
            description: '快递员已揽收包裹'
          },
          {
            status: '运输中',
            location: '北京市转运中心',
            time: '2024-01-15 14:00:00',
            description: '包裹已到达北京转运中心'
          },
          {
            status: '运输中',
            location: '河北省石家庄市转运中心',
            time: '2024-01-16 02:30:00',
            description: '包裹已到达石家庄转运中心'
          },
          {
            status: '派送中',
            location: '河北省唐山市路南区',
            time: '2024-01-17 08:00:00',
            description: '快递员正在派送中'
          }
        ]
      },
      'ORD20240114002': {
        orderId: 'ORD20240114002',
        userId: userId,
        company: '顺丰速运',
        trackingNumber: 'SF9876543210',
        currentStatus: '已签收',
        estimatedDelivery: null,
        routes: [
          {
            status: '已揽收',
            location: '北京市朝阳区',
            time: '2024-01-14 15:30:00',
            description: '快递员已揽收包裹'
          },
          {
            status: '运输中',
            location: '北京市转运中心',
            time: '2024-01-14 18:00:00',
            description: '包裹已到达北京转运中心'
          },
          {
            status: '派送中',
            location: '北京市朝阳区',
            time: '2024-01-16 09:00:00',
            description: '快递员正在派送中'
          },
          {
            status: '已签收',
            location: '北京市朝阳区',
            time: '2024-01-16 14:30:00',
            description: '包裹已签收，签收人：本人'
          }
        ]
      }
    };

    return mockData[orderId] || null;
  }

  /**
   * 检测物流异常
   * @param {Object} logistics - 物流信息
   * @returns {Array} - 异常列表
   */
  detectAnomalies(logistics) {
    const anomalies = [];

    // 检查是否超时未更新
    const lastUpdate = new Date(logistics.routes[logistics.routes.length - 1].time);
    const now = new Date();
    const diffHours = (now - lastUpdate) / (1000 * 60 * 60);

    if (logistics.currentStatus !== '已签收' && diffHours > 48) {
      anomalies.push({
        type: '超时未更新',
        severity: '高',
        description: `物流信息已超过48小时未更新，可能存在异常`
      });
    }

    // 检查是否超过预计送达时间
    if (logistics.estimatedDelivery) {
      const estimatedDate = new Date(logistics.estimatedDelivery);
      if (now > estimatedDate && logistics.currentStatus !== '已签收') {
        anomalies.push({
          type: '超时未送达',
          severity: '中',
          description: `预计送达时间 ${logistics.estimatedDelivery} 已过，但尚未签收`
        });
      }
    }

    // 检查是否长时间停留在某个节点
    if (logistics.routes.length >= 2) {
      const lastTwoRoutes = logistics.routes.slice(-2);
      const timeDiff = new Date(lastTwoRoutes[1].time) - new Date(lastTwoRoutes[0].time);
      const diffDays = timeDiff / (1000 * 60 * 60 * 24);

      if (diffDays > 5) {
        anomalies.push({
          type: '停滞过久',
          severity: '中',
          description: `物流在${lastTwoRoutes[0].location}停留超过5天`
        });
      }
    }

    return anomalies;
  }
}

module.exports = { LogisticsTool };
