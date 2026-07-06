import "./all-checks";
import { AuditIssue } from '../../audit/types';
import { run as checkImages } from './images';
import { run as checkIndexability } from './indexability';
import { run as checkInternational } from './international';
import { run as checkLocal } from './local';
import { run as checkMobile } from './mobile';
import { run as checkPerformance } from './performance';
import { run as checkRobots } from './robots';
import { run as checkSchema } from './schema';
import { run as checkSecurity } from './security';
import { run as checkSitemap } from './sitemap';
import { run as checkSocial } from './social';
import { run as checkTechnical } from './technical';
import { run as checkOnPage } from './on-page';
import { run as checkContent } from './content';
import { run as checkLinks } from './links';

import { eventEmitter } from '../../audit/event-emitter';

export function runAllChecks(pageData: any, auditId?: string): AuditIssue[] {
  let issues: AuditIssue[] = [];
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Images', pageData.url);
  const issuesImages = checkImages(pageData, auditId);
  if (auditId) {
    issuesImages.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Images', pageData.url);
  }
  issues = issues.concat(issuesImages);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Indexability', pageData.url);
  const issuesIndexability = checkIndexability(pageData, auditId);
  if (auditId) {
    issuesIndexability.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Indexability', pageData.url);
  }
  issues = issues.concat(issuesIndexability);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'International', pageData.url);
  const issuesInternational = checkInternational(pageData, auditId);
  if (auditId) {
    issuesInternational.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'International', pageData.url);
  }
  issues = issues.concat(issuesInternational);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Local', pageData.url);
  const issuesLocal = checkLocal(pageData, auditId);
  if (auditId) {
    issuesLocal.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Local', pageData.url);
  }
  issues = issues.concat(issuesLocal);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Mobile', pageData.url);
  const issuesMobile = checkMobile(pageData, auditId);
  if (auditId) {
    issuesMobile.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Mobile', pageData.url);
  }
  issues = issues.concat(issuesMobile);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Performance', pageData.url);
  const issuesPerformance = checkPerformance(pageData, auditId);
  if (auditId) {
    issuesPerformance.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Performance', pageData.url);
  }
  issues = issues.concat(issuesPerformance);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Robots', pageData.url);
  const issuesRobots = checkRobots(pageData, auditId);
  if (auditId) {
    issuesRobots.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Robots', pageData.url);
  }
  issues = issues.concat(issuesRobots);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Schema', pageData.url);
  const issuesSchema = checkSchema(pageData, auditId);
  if (auditId) {
    issuesSchema.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Schema', pageData.url);
  }
  issues = issues.concat(issuesSchema);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Security', pageData.url);
  const issuesSecurity = checkSecurity(pageData, auditId);
  if (auditId) {
    issuesSecurity.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Security', pageData.url);
  }
  issues = issues.concat(issuesSecurity);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Sitemap', pageData.url);
  const issuesSitemap = checkSitemap(pageData, auditId);
  if (auditId) {
    issuesSitemap.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Sitemap', pageData.url);
  }
  issues = issues.concat(issuesSitemap);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Social', pageData.url);
  const issuesSocial = checkSocial(pageData, auditId);
  if (auditId) {
    issuesSocial.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Social', pageData.url);
  }
  issues = issues.concat(issuesSocial);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Technical', pageData.url);
  const issuesTechnical = checkTechnical(pageData, auditId);
  if (auditId) {
    issuesTechnical.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Technical', pageData.url);
  }
  issues = issues.concat(issuesTechnical);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'OnPage', pageData.url);
  const issuesOnPage = checkOnPage(pageData, auditId);
  if (auditId) {
    issuesOnPage.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'OnPage', pageData.url);
  }
  issues = issues.concat(issuesOnPage);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Content', pageData.url);
  const issuesContent = checkContent(pageData, auditId);
  if (auditId) {
    issuesContent.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Content', pageData.url);
  }
  issues = issues.concat(issuesContent);
  if (auditId) eventEmitter.emitCheckStarted(auditId, 'Links', pageData.url);
  const issuesLinks = checkLinks(pageData, auditId);
  if (auditId) {
    issuesLinks.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, 'Links', pageData.url);
  }
  issues = issues.concat(issuesLinks);
  return issues;
}
