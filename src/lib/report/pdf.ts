import PDFDocument from 'pdfkit';
import type { ResourceAuditIssue, ResourceAuditLiveData, ResourceAuditPage } from '../audit/resource-types';

const COLORS = {
  ink: '#10243a',
  muted: '#5e7185',
  line: '#d7e0ea',
  panel: '#f6f8fb',
  blue: '#1764e8',
  green: '#0f9f6e',
  amber: '#d97706',
  orange: '#ea580c',
  red: '#dc2626',
};

function numberScore(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : fallback;
}

function estimatedScore(data: ResourceAuditLiveData) {
  const audit = data.audit;
  if (!audit) return 0;
  return Math.max(0, Math.min(100, 100 - audit.criticalCount * 12 - audit.highCount * 7 - audit.mediumCount * 3 - audit.lowCount));
}

function severityColor(severity: string) {
  if (severity === 'critical') return COLORS.red;
  if (severity === 'high') return COLORS.orange;
  if (severity === 'medium') return COLORS.amber;
  return COLORS.blue;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function renderAuditPdf(data: ResourceAuditLiveData): Promise<Buffer> {
  if (!data.audit) throw new Error('Audit data is required to build a PDF report.');
  const audit = data.audit;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 44, right: 44, bottom: 48, left: 44 },
      bufferPages: true,
      info: {
        Title: `SEOIntel audit report - ${audit.hostname}`,
        Author: 'SEOIntel',
        Subject: 'SEO, website health, and passive browser safety audit',
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const margin = 44;
    const contentWidth = doc.page.width - margin * 2;
    const bottom = () => doc.page.height - 54;

    const drawHeader = () => {
      doc.fillColor(COLORS.blue).font('Helvetica-Bold').fontSize(16).text('SEOIntel', margin, 28, { lineBreak: false });
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text('SEO AUDIT REPORT', margin + 76, 34, { lineBreak: false });
      doc.moveTo(margin, 52).lineTo(doc.page.width - margin, 52).strokeColor(COLORS.line).lineWidth(1).stroke();
      doc.y = 66;
    };

    const ensureSpace = (height: number) => {
      if (doc.y + height <= bottom()) return;
      doc.addPage();
      drawHeader();
    };

    const sectionTitle = (title: string, description?: string) => {
      ensureSpace(description ? 48 : 30);
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(16).text(title, margin, doc.y, { width: contentWidth });
      if (description) {
        doc.moveDown(0.25).fillColor(COLORS.muted).font('Helvetica').fontSize(9).text(description, margin, doc.y, { width: contentWidth, lineGap: 2 });
      }
      doc.moveDown(0.7);
    };

    const drawScoreBar = (label: string, value: number, color: string) => {
      ensureSpace(28);
      const y = doc.y;
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(9).text(label, margin, y, { width: 126, lineBreak: false });
      doc.fillColor(COLORS.panel).roundedRect(margin + 132, y + 1, contentWidth - 166, 10, 5).fill();
      doc.fillColor(color).roundedRect(margin + 132, y + 1, Math.max(2, (contentWidth - 166) * (value / 100)), 10, 5).fill();
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(9).text(String(Math.round(value)), doc.page.width - margin - 28, y, { width: 28, align: 'right', lineBreak: false });
      doc.y = y + 24;
    };

    const drawMetric = (x: number, y: number, width: number, label: string, value: string, color: string) => {
      doc.roundedRect(x, y, width, 58, 8).fillAndStroke('#ffffff', COLORS.line);
      doc.fillColor(color).font('Helvetica-Bold').fontSize(20).text(value, x + 12, y + 11, { width: width - 24, lineBreak: false });
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(label, x + 12, y + 37, { width: width - 24, lineBreak: false });
    };

    const drawIssue = (issue: ResourceAuditIssue, index: number) => {
      const innerWidth = contentWidth - 24;
      doc.font('Helvetica-Bold').fontSize(10);
      const issueTitle = `[ ] ${index + 1}. ${issue.title}`;
      const titleHeight = doc.heightOfString(issueTitle, { width: innerWidth - 90 });
      doc.font('Helvetica').fontSize(8);
      const urlHeight = doc.heightOfString(issue.affectedUrl || 'Site-wide', { width: innerWidth });
      const evidence = issue.evidence || issue.description || 'The audit found this issue in the public page data.';
      const recommendation = issue.recommendation || 'Review this finding and apply the recommended website change.';
      const evidenceHeight = doc.heightOfString(`What happened: ${evidence}`, { width: innerWidth, lineGap: 1 });
      const recommendationHeight = doc.heightOfString(`How to fix it: ${recommendation}`, { width: innerWidth, lineGap: 1 });
      const height = 34 + titleHeight + urlHeight + evidenceHeight + recommendationHeight;
      ensureSpace(height + 12);
      const y = doc.y;

      doc.roundedRect(margin, y, contentWidth, height, 8).fillAndStroke('#ffffff', COLORS.line);
      doc.fillColor(severityColor(issue.severity)).roundedRect(margin + 12, y + 12, 72, 17, 6).fill();
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7).text(issue.severity.toUpperCase(), margin + 12, y + 17, { width: 72, align: 'center', lineBreak: false });
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10).text(issueTitle, margin + 94, y + 13, { width: contentWidth - 106 });
      let cursor = y + 18 + Math.max(17, titleHeight);
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5).text(issue.affectedUrl || 'Site-wide', margin + 12, cursor, { width: innerWidth });
      cursor += urlHeight + 7;
      doc.fillColor(COLORS.ink).font('Helvetica').fontSize(8).text(`What happened: ${evidence}`, margin + 12, cursor, { width: innerWidth, lineGap: 1 });
      cursor += evidenceHeight + 6;
      doc.fillColor(COLORS.ink).font('Helvetica').fontSize(8).text(`How to fix it: ${recommendation}`, margin + 12, cursor, { width: innerWidth, lineGap: 1 });
      doc.y = y + height + 8;
    };

    const pageColumns = [
      { label: 'Code', width: 38 },
      { label: 'Page URL', width: 260 },
      { label: 'Response', width: 62 },
      { label: 'Size', width: 62 },
      { label: 'Fixes', width: 45 },
    ];

    const drawPageTableHeader = () => {
      ensureSpace(26);
      const y = doc.y;
      doc.fillColor(COLORS.ink).roundedRect(margin, y, contentWidth, 22, 4).fill();
      let x = margin;
      pageColumns.forEach((column) => {
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7).text(column.label, x + 5, y + 7, { width: column.width - 10, lineBreak: false });
        x += column.width;
      });
      doc.y = y + 24;
    };

    const drawPageRow = (page: ResourceAuditPage, index: number) => {
      doc.font('Helvetica').fontSize(7.5);
      const urlHeight = doc.heightOfString(page.url, { width: pageColumns[1].width - 10 });
      const rowHeight = Math.max(23, urlHeight + 10);
      if (doc.y + rowHeight > bottom()) {
        doc.addPage();
        drawHeader();
        drawPageTableHeader();
      }
      const y = doc.y;
      doc.fillColor(index % 2 === 0 ? '#ffffff' : COLORS.panel).rect(margin, y, contentWidth, rowHeight).fill();
      let x = margin;
      const values = [String(page.statusCode), page.url, `${page.responseTimeMs}ms`, formatBytes(page.pageSizeBytes), String(page.issueCount)];
      values.forEach((value, valueIndex) => {
        doc.fillColor(valueIndex === 0 && page.statusCode >= 400 ? COLORS.red : COLORS.ink).font(valueIndex === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).text(value, x + 5, y + 7, { width: pageColumns[valueIndex].width - 10, lineGap: 1 });
        x += pageColumns[valueIndex].width;
      });
      doc.moveTo(margin, y + rowHeight).lineTo(margin + contentWidth, y + rowHeight).strokeColor(COLORS.line).lineWidth(0.5).stroke();
      doc.y = y + rowHeight;
    };

    drawHeader();
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(25).text('Website audit report', margin, doc.y, { width: contentWidth });
    doc.moveDown(0.25).fillColor(COLORS.blue).font('Helvetica-Bold').fontSize(11).text(audit.normalizedUrl, margin, doc.y, { width: contentWidth });
    doc.moveDown(0.55).fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text(`Audit type: ${audit.processingTier}  |  Status: ${audit.status}  |  Pages checked: ${audit.pagesCrawled}/${audit.pageLimit}  |  Generated: ${new Date().toLocaleString()}`, margin, doc.y, { width: contentWidth });
    doc.moveDown(1);

    const scores = (data.finalReport?.scores || {}) as Record<string, unknown>;
    const overall = numberScore(scores.overall, estimatedScore(data));
    const metricGap = 10;
    const metricWidth = (contentWidth - metricGap * 3) / 4;
    const metricY = doc.y;
    drawMetric(margin, metricY, metricWidth, 'Site health', String(Math.round(overall)), overall >= 80 ? COLORS.green : overall >= 60 ? COLORS.blue : COLORS.amber);
    drawMetric(margin + (metricWidth + metricGap), metricY, metricWidth, 'Pages checked', String(audit.pagesCrawled), COLORS.blue);
    drawMetric(margin + (metricWidth + metricGap) * 2, metricY, metricWidth, 'Open fixes', String(audit.issuesFound), COLORS.amber);
    drawMetric(margin + (metricWidth + metricGap) * 3, metricY, metricWidth, 'Fix now', String(audit.criticalCount), audit.criticalCount ? COLORS.red : COLORS.green);
    doc.y = metricY + 76;

    sectionTitle('Executive summary', data.finalReport?.summary || `SEOIntel checked ${audit.pagesCrawled} page(s) and found ${audit.issuesFound} issue(s).`);
    drawScoreBar('SEO', numberScore(scores.seo, overall), COLORS.blue);
    drawScoreBar('Technical SEO', numberScore(scores.technical, overall), COLORS.blue);
    drawScoreBar('Performance signals', numberScore(scores.performance, overall), COLORS.amber);
    drawScoreBar('Google access', numberScore(scores.crawlability, overall), COLORS.green);
    drawScoreBar('Browser safety', numberScore(scores.security, overall), COLORS.green);

    sectionTitle('Fix priority', 'Use this distribution to decide what to handle first.');
    const severities = [
      { label: 'Fix now', value: audit.criticalCount, color: COLORS.red },
      { label: 'High priority', value: audit.highCount, color: COLORS.orange },
      { label: 'Review soon', value: audit.mediumCount, color: COLORS.amber },
      { label: 'Nice to fix', value: audit.lowCount, color: COLORS.blue },
    ];
    const severityMax = Math.max(1, ...severities.map((item) => item.value));
    severities.forEach((item) => {
      ensureSpace(22);
      const y = doc.y;
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(item.label, margin, y, { width: 90, lineBreak: false });
      doc.fillColor(COLORS.panel).roundedRect(margin + 96, y, contentWidth - 130, 9, 4).fill();
      doc.fillColor(item.color).roundedRect(margin + 96, y, Math.max(2, (contentWidth - 130) * (item.value / severityMax)), 9, 4).fill();
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(8).text(String(item.value), doc.page.width - margin - 25, y, { width: 25, align: 'right', lineBreak: false });
      doc.y = y + 20;
    });

    sectionTitle('Top fixes', 'Each item includes a client-ready checklist box, evidence, and the recommended next action.');
    data.latestIssues.slice(0, 50).forEach(drawIssue);
    if (data.latestIssues.length > 50) {
      ensureSpace(28);
      doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(8).text(`${data.latestIssues.length - 50} additional findings are available in the JSON and CSV exports.`, margin, doc.y, { width: contentWidth });
      doc.moveDown(1);
    }

    ensureSpace(92);
    sectionTitle('Pages checked', 'Response, size, and issue counts from the stored audit page summaries.');
    drawPageTableHeader();
    data.latestPages.slice(0, 100).forEach(drawPageRow);
    if (data.latestPages.length > 100) {
      ensureSpace(24);
      doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(8).text(`${data.latestPages.length - 100} additional page rows are available in the pages CSV export.`, margin, doc.y + 6, { width: contentWidth });
      doc.moveDown(1.2);
    }

    const firstPage = data.latestPages.find((page) => page.title || page.metaDescription) || data.latestPages[0];
    sectionTitle('Search and page preview', 'A safe metadata-based preview is included because live external pages cannot be embedded inside a PDF.');
    ensureSpace(128);
    const previewY = doc.y;
    doc.roundedRect(margin, previewY, contentWidth, 116, 8).fillAndStroke('#ffffff', COLORS.line);
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(firstPage?.url || audit.finalUrl || audit.normalizedUrl, margin + 14, previewY + 14, { width: contentWidth - 28 });
    doc.fillColor(COLORS.blue).font('Helvetica-Bold').fontSize(14).text(firstPage?.title || `${audit.hostname} audit result`, margin + 14, previewY + 38, { width: contentWidth - 28, height: 36, ellipsis: true });
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text(firstPage?.metaDescription || 'No meta description was available for the preview.', margin + 14, previewY + 76, { width: contentWidth - 28, height: 28, ellipsis: true });
    doc.y = previewY + 130;

    sectionTitle('Audit activity', 'Recent audit events show how the report was produced.');
    data.latestEvents.slice(-20).forEach((event) => {
      const label = `${new Date(event.timestamp).toLocaleTimeString()}  ${event.message || event.type}`;
      const height = doc.heightOfString(label, { width: contentWidth - 18, lineGap: 1 }) + 8;
      ensureSpace(height);
      const y = doc.y;
      doc.fillColor(COLORS.blue).circle(margin + 4, y + 5, 2.5).fill();
      doc.fillColor(COLORS.ink).font('Helvetica').fontSize(8).text(label, margin + 14, y, { width: contentWidth - 18, lineGap: 1 });
      doc.y = y + height;
    });

    const range = doc.bufferedPageRange();
    for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
      doc.switchToPage(pageIndex);
      const originalBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const footerY = doc.page.height - 30;
      doc.moveTo(margin, footerY - 8).lineTo(doc.page.width - margin, footerY - 8).strokeColor(COLORS.line).lineWidth(0.5).stroke();
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7).text(`SEOIntel  |  ${audit.hostname}  |  Page ${pageIndex + 1} of ${range.count}`, margin, footerY, { width: contentWidth, align: 'center', lineBreak: false });
      doc.page.margins.bottom = originalBottomMargin;
    }

    doc.end();
  });
}
