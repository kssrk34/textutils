import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => localStorage.clear());

const editor = () => screen.getByLabelText('Document');
const type = (value) => fireEvent.change(editor(), { target: { value } });

test('renders the editor with the welcome text', () => {
  render(<App />);
  expect(editor().value).toMatch(/Welcome to Inkwell/);
});

test('uppercase transform applies to the whole document when nothing is selected', () => {
  render(<App />);
  type('hello world');
  fireEvent.click(screen.getByRole('button', { name: 'UPPERCASE' }));
  expect(editor().value).toBe('HELLO WORLD');
});

test('undo restores the previous text', () => {
  render(<App />);
  type('hello world');
  fireEvent.click(screen.getByRole('button', { name: 'UPPERCASE' }));
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(editor().value).toBe('hello world');
});

test('command palette opens with Ctrl+K and runs a command', async () => {
  render(<App />);
  type('Hello World');
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  const input = screen.getByLabelText('Search commands');
  fireEvent.change(input, { target: { value: 'snake' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => expect(editor().value).toBe('hello_world'));
});

test('find reports the number of matches and replace all works', () => {
  render(<App />);
  type('cat dog cat');
  fireEvent.keyDown(window, { key: 'h', ctrlKey: true });
  fireEvent.change(screen.getByRole('textbox', { name: 'Find' }), { target: { value: 'cat' } });
  expect(screen.getByText('1 of 2')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'fox' } });
  fireEvent.click(screen.getByRole('button', { name: 'All' }));
  expect(editor().value).toBe('fox dog fox');
});

test('theme can be switched', () => {
  render(<App />);
  fireEvent.click(screen.getByLabelText('Paper theme'));
  expect(document.documentElement.dataset.theme).toBe('paper');
});
