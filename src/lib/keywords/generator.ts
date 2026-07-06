import { classifyIntent, getFunnelStage } from './intent';
import { estimateDifficulty } from './difficulty';
import { calculateOpportunityScore } from './opportunity';

export interface KeywordResult {
  id: string;
  keyword: string;
  intent: string;
  funnelStage: string;
  relevanceScore: number;
  estimatedDifficulty: number;
  importedDifficulty?: number;
  importedVolume?: number;
  importedCpc?: number;
  opportunityScore: number;
  clusterId?: string;
  suggestedContentType: string;
  source: string;
}

export function generateKeywords(seed: string): KeywordResult[] {
  const normalizedSeed = seed.toLowerCase().trim();
  const results: KeywordResult[] = [];
  let idCounter = 1;

  const addResult = (kw: string, source: string, rel: number = 70) => {
    if (!kw || kw.trim() === '') return;
    const diff = estimateDifficulty(kw);
    const intent = classifyIntent(kw);
    
    let contentType = "Blog Post";
    if (intent === "Transactional") contentType = "Service/Product Page";
    if (intent === "Commercial") contentType = "Comparison/Review Page";

    results.push({
      id: String(idCounter++),
      keyword: kw,
      intent,
      funnelStage: getFunnelStage(intent),
      relevanceScore: rel,
      estimatedDifficulty: diff,
      opportunityScore: calculateOpportunityScore(kw, rel),
      suggestedContentType: contentType,
      source
    });
  };

  const prefixes = {
    questions: ['what is', 'how to', 'why', 'when', 'where', 'who', 'is', 'can', 'do', 'are'],
    commercial: ['best', 'top', 'affordable', 'cheap', 'custom', 'professional', 'expert', 'reliable', 'certified'],
    transactional: ['buy', 'hire', 'find', 'get', 'order', 'download'],
    local: ['local'],
    comparisons: ['best'],
    industry: ['for small business', 'for startups', 'for enterprise', 'for beginners']
  };

  const suffixes = {
    questions: ['explained', 'definition', 'meaning'],
    commercial: ['services', 'software', 'tools', 'agency', 'company', 'consultant', 'experts', 'platform', 'app'],
    transactional: ['price', 'cost', 'pricing', 'quote', 'packages'],
    local: ['near me', 'in my area', 'nearby'],
    comparisons: ['alternatives', 'competitors', 'vs', 'compared', 'reviews', 'pros and cons'],
    problem: ['mistakes', 'issues', 'problems', 'challenges', 'examples'],
    resources: ['template', 'checklist', 'calculator', 'guide', 'pdf', 'tutorial']
  };

  addResult(normalizedSeed, 'Seed', 100);

  // Apply prefixes
  for (const p of prefixes.questions) addResult(`${p} ${normalizedSeed}`, 'Question Modifier', 85);
  for (const p of prefixes.commercial) addResult(`${p} ${normalizedSeed}`, 'Commercial Modifier', 80);
  for (const p of prefixes.transactional) addResult(`${p} ${normalizedSeed}`, 'Transactional Modifier', 80);

  // Apply suffixes
  for (const s of suffixes.commercial) addResult(`${normalizedSeed} ${s}`, 'Commercial Modifier', 80);
  for (const s of suffixes.transactional) addResult(`${normalizedSeed} ${s}`, 'Transactional Modifier', 85);
  for (const s of suffixes.local) addResult(`${normalizedSeed} ${s}`, 'Local Modifier', 75);
  for (const s of suffixes.comparisons) {
    if (s === 'vs') {
      addResult(`${normalizedSeed} vs alternative`, 'Comparison Modifier', 70);
    } else {
      addResult(`${normalizedSeed} ${s}`, 'Comparison Modifier', 70);
    }
  }
  for (const s of suffixes.problem) addResult(`${normalizedSeed} ${s}`, 'Problem/Solution Modifier', 85);
  for (const s of suffixes.resources) addResult(`${normalizedSeed} ${s}`, 'Resource Modifier', 85);
  for (const s of prefixes.industry) addResult(`${normalizedSeed} ${s}`, 'Industry Modifier', 75);

  // Alphabet expansion (basic)
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  for (const letter of alphabet) {
    addResult(`${normalizedSeed} ${letter}`, 'Alphabet Expansion', 60);
  }

  // Filter out exact duplicates
  const uniqueResults = Array.from(new Map(results.map(item => [item.keyword, item])).values());
  
  return uniqueResults;
}
