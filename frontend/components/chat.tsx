'use client'
import { Button, Checkbox, Group, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

function ChatBox() {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      termsOfService: false,
    },

    validate: {
      email: (value: any) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = async (values: any) => {
    try {
      const { email } = values;

      // Construct the URL for the GET request
      const url = `http://127.0.0.1:5000/ask/${encodeURIComponent(email)}`;

      // Perform GET request to AI model endpoint
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      const data = await response.json();
      console.log('AI Response:', data);

      // Handle AI response as needed
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        withAsterisk
        label="Email"
        placeholder="your@email.com"
        key={form.key('email')}
        {...form.getInputProps('email')}
      />

      <Checkbox
        mt="md"
        label="I agree to sell my privacy"
        key={form.key('termsOfService')}
        {...form.getInputProps('termsOfService', { type: 'checkbox' })}
      />

      <Group justify="flex-end" mt="md">
        <Button type="submit">Submit</Button>
      </Group>
    </form>
  );
}

export default ChatBox;
