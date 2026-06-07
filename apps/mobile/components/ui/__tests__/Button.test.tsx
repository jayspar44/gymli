import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

test('renders label and fires onPress', async () => {
  const onPress = jest.fn();
  const { getByText } = await render(<Button onPress={onPress}>Go</Button>);
  fireEvent.press(getByText('Go'));
  expect(onPress).toHaveBeenCalled();
});
