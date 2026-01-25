const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

class DocumentProcessor {

  /**
   * 解析文档
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} - 文档内容
   */
  async parseDocument(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.pdf':
        return await this.parsePDF(filePath);
      case '.doc':
      case '.docx':
        return await this.parseDocx(filePath);
      case '.md':
        return await this.parseMarkdown(filePath);
      case '.txt':
        return await this.parseText(filePath);
      default:
        throw new Error('不支持的文件格式');
    }
  }

  /**
   * 解析PDF文档
   */
  async parsePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF解析失败: ${error.message}`);
    }
  }

  /**
   * 解析DOCX文档
   */
  async parseDocx(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX解析失败: ${error.message}`);
    }
  }

  /**
   * 解析Markdown文档
   */
  async parseMarkdown(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.stripMarkdown(content);
    } catch (error) {
      throw new Error(`Markdown解析失败: ${error.message}`);
    }
  }

  /**
   * 解析纯文本文档
   */
  async parseText(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`文本解析失败: ${error.message}`);
    }
  }

  /**
   * 去除Markdown格式，保留纯文本
   * @param {string} markdown - Markdown内容
   * @returns {string} - 纯文本
   */
  stripMarkdown(markdown) {
    let text = markdown;

    // 先去除代码块（避免内部内容被处理）
    text = text.replace(/```[^`]*```/gs, '');

    // 去除标题标记 (# )
    text = text.replace(/^#{1,6}\s+/gm, '');

    // 去除粗斜体
    text = text.replace(/\*\*\*[^*]+\*\*\*/g, (match) => match.slice(3, -3));
    text = text.replace(/\*\*[^*]+\*\*/g, (match) => match.slice(2, -2));
    text = text.replace(/__(?!_)[^_]+__(?!_)/g, (match) => match.slice(2, -2));

    // 去除斜体（注意避免误删）
    text = text.replace(/(?<!\*)\*(?!\*)[^*]+(?<!\*)\*(?!\*)/g, (match) => match.slice(1, -1));
    text = text.replace(/(?<!_)_(?!_)[^_]+(?<!_)_(?!_)/g, (match) => match.slice(1, -1));

    // 去除删除线
    text = text.replace(/~~[^~]+~~/g, (match) => match.slice(2, -2));

    // 去除行内代码
    text = text.replace(/`[^`]+`/g, (match) => match.slice(1, -1));

    // 去除链接 [text](url)
    text = text.replace(/\[[^\]]+\]\([^)]+\)/g, (match) => {
      const match2 = match.match(/\[([^\]]+)\]/);
      return match2 ? match2[1] : '';
    });

    // 去除图片
    text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

    // 去除无序列表标记 - + *
    text = text.replace(/^[\-\+*]\s+/gm, '');

    // 去除有序列表标记 1.
    text = text.replace(/^\d+\.\s+/gm, '');

    // 去除引用标记 >
    text = text.replace(/^>\s+/gm, '');

    // 去除水平线
    text = text.replace(/^[\-\*_]{3,}\s*$/gm, '');

    // 去除多余的空行
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
  }

  /**
   * 将文档分割成块
   * @param {string} content - 文档内容
   * @param {number} chunkSize - 块大小（字符数）
   * @param {number} overlap - 重叠字符数
   * @returns {Array<string>} - 文档块数组
   */
  splitIntoChunks(content, chunkSize = 1000, overlap = 100) {
    const chunks = [];
    const contentLength = content.length;
    let startIndex = 0;

    while (startIndex < contentLength) {
      let endIndex = Math.min(startIndex + chunkSize, contentLength);
      const chunk = content.substring(startIndex, endIndex);
      chunks.push(chunk);

      // 检查是否已经到达末尾
      if (endIndex >= contentLength) {
        break;
      }

      // 移动到下一个 chunk，带重叠
      startIndex = endIndex - overlap;
      if (startIndex < 0) {
        startIndex = 0;
      }
    }

    return chunks;
  }
}

module.exports = { DocumentProcessor };
