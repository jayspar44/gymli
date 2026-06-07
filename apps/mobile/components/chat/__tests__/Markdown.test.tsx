import { render } from '@testing-library/react-native';
import { Markdown } from '../Markdown';

test('renders bold and bullets', async () => {
  const { getByText } = await render(<Markdown>{"Do **this**\n\n- a\n- b"}</Markdown>);
  expect(getByText('this')).toBeTruthy();
  expect(getByText('a')).toBeTruthy();
});
