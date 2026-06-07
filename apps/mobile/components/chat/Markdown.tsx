import { Text, View } from 'react-native';

// Renders the limited subset Gemini emits: **bold**, bullet/numbered lists, paragraphs, line breaks.
function renderInline(text: string, keyBase: string) {
  // split on **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <Text key={`${keyBase}-${i}`} className="font-semibold">{p.slice(2, -2)}</Text>
      : <Text key={`${keyBase}-${i}`}>{p}</Text>
  );
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  const blocks = children.split(/\n{2,}/); // paragraphs
  return (
    <View>
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        const isBullet = lines.every((l) => /^\s*[-*]\s+/.test(l));
        const isNumbered = lines.every((l) => /^\s*\d+\.\s+/.test(l));
        if (isBullet || isNumbered) {
          return (
            <View key={bi} className="mb-2 gap-1">
              {lines.map((l, li) => {
                const content = l.replace(/^\s*([-*]|\d+\.)\s+/, '');
                const marker = isNumbered ? `${li + 1}.` : '•';
                return (
                  <View key={li} className="flex-row gap-2">
                    <Text className={className}>{marker}</Text>
                    <Text className={(className ?? '') + ' flex-1'}>{renderInline(content, `${bi}-${li}`)}</Text>
                  </View>
                );
              })}
            </View>
          );
        }
        return <Text key={bi} className={(className ?? '') + ' mb-2'}>{renderInline(block, `${bi}`)}</Text>;
      })}
    </View>
  );
}
