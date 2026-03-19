import React from 'react';
import { Text, View } from 'react-native';

function stripSourcesSection(input: string) {
  const s = String(input || '');
  // Remove everything from "## Sources" onward (Community Assistant shows sources as cards already).
  const idx = s.toLowerCase().indexOf('## sources');
  if (idx >= 0) return s.slice(0, idx).trim();
  return s.trim();
}

function stripAnswerHeadingLine(line: string) {
  const t = line.trim();
  if (t.toLowerCase() === '## answer') return '';
  if (t.toLowerCase() === '# answer') return '';
  return line;
}

function cleanInline(text: string) {
  // Remove source markers like [1], [2] in-line (they clutter chat).
  return text.replace(/\[\d+\]/g, '').replace(/\s{2,}/g, ' ').trim();
}

function renderInlineBold(text: string, boldClassName: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} className={`font-semibold ${boldClassName}`}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

export function FormattedAiText({
  content,
  variant = 'dark',
  hideSourcesSection = true,
  size = 'md',
}: {
  content: string;
  variant?: 'dark' | 'light';
  hideSourcesSection?: boolean;
  size?: 'md' | 'lg';
}) {
  const body = hideSourcesSection ? stripSourcesSection(content) : String(content || '').trim();
  const lines = body.split('\n').map(stripAnswerHeadingLine);
  const textClass = variant === 'light' ? 'text-gray-800' : 'text-gray-100';
  const headingClass = variant === 'light' ? 'text-gray-900' : 'text-white';
  const boldClass = variant === 'light' ? 'text-gray-900' : 'text-white';
  const bulletColorClass = variant === 'light' ? 'text-emerald-700' : 'text-emerald-400';
  const bodySizeClass = size === 'lg' ? 'text-lg leading-8' : 'text-base leading-7';
  const headingSizeClass = size === 'lg' ? 'text-lg' : 'text-base';

  return (
    <View>
      {lines.map((raw, idx) => {
        const line = raw.trim();
        if (!line) return <View key={idx} style={{ height: 8 }} />;

        // Headings like "## Something"
        if (line.startsWith('## ')) {
          return (
            <Text key={idx} className={`${headingSizeClass} font-semibold ${headingClass}`} style={{ marginTop: 8 }}>
              {cleanInline(line.replace('## ', ''))}
            </Text>
          );
        }

        // Bullets "- ..."
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const bullet = cleanInline(line.replace(/^[-•]\s*/, ''));
          if (!bullet) return null;
          return (
            <Text key={idx} className={`${bodySizeClass} ${textClass}`} style={{ marginTop: 4 }}>
              <Text className={`${bulletColorClass}`}>• </Text>
              {renderInlineBold(bullet, boldClass)}
            </Text>
          );
        }

        // Numbered lists like "1) ..."
        const numbered = line.match(/^(\d+)\)\s*(.*)$/);
        if (numbered) {
          const n = numbered[1];
          const rest = cleanInline(numbered[2] || '');
          return (
            <Text key={idx} className={`${bodySizeClass} ${textClass}`} style={{ marginTop: 4 }}>
              <Text className={`${bulletColorClass} font-semibold`}>{n}. </Text>
              {renderInlineBold(rest, boldClass)}
            </Text>
          );
        }

        // Horizontal rule
        if (line === '---') return <View key={idx} className={variant === 'light' ? 'h-px bg-gray-200 my-2' : 'h-px bg-white/10 my-2'} />;

        // Regular paragraph
        const cleaned = cleanInline(line);
        return (
          <Text key={idx} className={`${bodySizeClass} ${textClass}`} style={{ marginTop: 4 }}>
            {renderInlineBold(cleaned, boldClass)}
          </Text>
        );
      })}
    </View>
  );
}

