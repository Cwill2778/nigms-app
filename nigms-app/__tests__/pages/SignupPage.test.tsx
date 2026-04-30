// Unit tests for SignupPage component
// Validates: Requirements 1.3, 1.6, 1.8, 1.10
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from '@/app/(public)/signup/page';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock NLoader component
vi.mock('@/components/NLoader', () => ({
  default: ({ size }: { size?: string }) => (
    <div data-testid="nloader" data-size={size}>
      Loading...
    </div>
  ),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('renders all four fields (Name, Company Name, Email, Password)', () => {
    render(<SignupPage />);

    // Check for Name field (exact match to avoid matching "Company Name")
    const nameInput = screen.getByLabelText(/^Name \*$/);
    expect(nameInput).toBeTruthy();
    expect(nameInput.getAttribute('type')).toBe('text');
    expect(nameInput.getAttribute('required')).toBe('');

    // Check for Company Name field
    const companyNameInput = screen.getByLabelText(/Company Name/i);
    expect(companyNameInput).toBeTruthy();
    expect(companyNameInput.getAttribute('type')).toBe('text');
    expect(companyNameInput.getAttribute('required')).toBeNull();

    // Check for Email field
    const emailInput = screen.getByLabelText(/^Email \*$/);
    expect(emailInput).toBeTruthy();
    expect(emailInput.getAttribute('type')).toBe('email');
    expect(emailInput.getAttribute('required')).toBe('');

    // Check for Password field
    const passwordInput = screen.getByLabelText(/^Password \*$/);
    expect(passwordInput).toBeTruthy();
    expect(passwordInput.getAttribute('type')).toBe('password');
    expect(passwordInput.getAttribute('required')).toBe('');
  });

  it('button disabled while loading', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                json: async () => ({ success: true }),
              }),
            100
          )
        )
    );

    render(<SignupPage />);

    const nameInput = screen.getByLabelText(/^Name \*$/);
    const emailInput = screen.getByLabelText(/^Email \*$/);
    const passwordInput = screen.getByLabelText(/^Password \*$/);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    // Fill in the form
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Button should be disabled immediately
    await waitFor(() => {
      expect(submitButton.getAttribute('disabled')).toBe('');
    });

    // NLoader should be visible
    const loader = screen.getByTestId('nloader');
    expect(loader).toBeTruthy();

    // Wait for the request to complete
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/property');
      },
      { timeout: 200 }
    );
  });

  it('inline error on 409 response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({}),
    });

    render(<SignupPage />);

    const nameInput = screen.getByLabelText(/^Name \*$/);
    const emailInput = screen.getByLabelText(/^Email \*$/);
    const passwordInput = screen.getByLabelText(/^Password \*$/);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    // Fill in the form
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for error message to appear
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /An account with this email already exists\./i
      );
      expect(errorMessage).toBeTruthy();
    });

    // Verify the error is displayed inline (near the email field)
    const emailError = screen.getByText(
      /An account with this email already exists\./i
    );
    expect(emailError.className).toContain('text-red-600');

    // Form should not be cleared
    expect((nameInput as HTMLInputElement).value).toBe('John Doe');
    expect((emailInput as HTMLInputElement).value).toBe('existing@example.com');
    expect((passwordInput as HTMLInputElement).value).toBe('password123');
  });

  it('redirects on success', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    render(<SignupPage />);

    const nameInput = screen.getByLabelText(/^Name \*$/);
    const emailInput = screen.getByLabelText(/^Email \*$/);
    const passwordInput = screen.getByLabelText(/^Password \*$/);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    // Fill in the form
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securepass123' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/property');
    });

    // Verify fetch was called with correct data
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Smith',
        company_name: undefined,
        email: 'jane@example.com',
        password: 'securepass123',
      }),
    });
  });

  it('displays general error on non-409 API failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    render(<SignupPage />);

    const nameInput = screen.getByLabelText(/^Name \*$/);
    const emailInput = screen.getByLabelText(/^Email \*$/);
    const passwordInput = screen.getByLabelText(/^Password \*$/);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    // Fill in the form
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      const errorMessage = screen.getByText(/Something went wrong\. Please try again\./i);
      expect(errorMessage).toBeTruthy();
    });
  });

  it('validates required fields before submission', async () => {
    render(<SignupPage />);

    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    // Try to submit empty form - this will trigger HTML5 validation
    // The form won't actually submit because of the required attributes
    fireEvent.click(submitButton);

    // Since HTML5 validation prevents form submission, we need to manually trigger
    // the form submit event to test our custom validation
    const form = submitButton.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    // Wait for validation error
    await waitFor(() => {
      const errorMessage = screen.getByText(/Name, Email, and Password are required\./i);
      expect(errorMessage).toBeTruthy();
    });

    // Fetch should not have been called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('accepts optional company name', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    render(<SignupPage />);

    const nameInput = screen.getByLabelText(/^Name \*$/);
    const companyNameInput = screen.getByLabelText(/Company Name/i);
    const emailInput = screen.getByLabelText(/^Email \*$/);
    const passwordInput = screen.getByLabelText(/^Password \*$/);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    // Fill in the form with company name
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    fireEvent.change(companyNameInput, { target: { value: 'Acme Properties' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securepass123' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/property');
    });

    // Verify fetch was called with company_name
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Smith',
        company_name: 'Acme Properties',
        email: 'jane@example.com',
        password: 'securepass123',
      }),
    });
  });
});
