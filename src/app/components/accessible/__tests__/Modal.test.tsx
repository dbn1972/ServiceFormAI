import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../../test/test-utils';
import Modal from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal Content</div>,
  };

  it('should render when isOpen is true', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(<Modal {...defaultProps} description="Modal description text" />);

    expect(screen.getByText('Modal description text')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={true} />);

    const overlay = screen.getByRole('dialog').parentElement;
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should not call onClose when overlay is clicked and closeOnOverlayClick is false', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);

    const overlay = screen.getByRole('dialog').parentElement;
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('should not show close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);

    expect(screen.queryByLabelText('Close dialog')).not.toBeInTheDocument();
  });

  describe('ARIA Attributes', () => {
    it('should have role="dialog"', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(<Modal {...defaultProps} />);

      const overlay = screen.getByRole('dialog').parentElement;
      expect(overlay).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(<Modal {...defaultProps} />);

      const overlay = screen.getByRole('dialog').parentElement;
      expect(overlay).toHaveAttribute('aria-labelledby', 'modal-title');

      const title = screen.getByText('Test Modal');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    it('should have aria-describedby when description is provided', () => {
      render(<Modal {...defaultProps} description="Test description" />);

      const overlay = screen.getByRole('dialog').parentElement;
      expect(overlay).toHaveAttribute('aria-describedby', 'modal-description');

      const description = screen.getByText('Test description');
      expect(description).toHaveAttribute('id', 'modal-description');
    });

    it('should not have aria-describedby when description is not provided', () => {
      render(<Modal {...defaultProps} />);

      const overlay = screen.getByRole('dialog').parentElement;
      expect(overlay).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Size variants', () => {
    it('should apply sm size class', () => {
      render(<Modal {...defaultProps} size="sm" />);

      const dialog = screen.getByRole('document');
      expect(dialog).toHaveClass('max-w-md');
    });

    it('should apply md size class by default', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('document');
      expect(dialog).toHaveClass('max-w-lg');
    });

    it('should apply lg size class', () => {
      render(<Modal {...defaultProps} size="lg" />);

      const dialog = screen.getByRole('document');
      expect(dialog).toHaveClass('max-w-2xl');
    });

    it('should apply xl size class', () => {
      render(<Modal {...defaultProps} size="xl" />);

      const dialog = screen.getByRole('document');
      expect(dialog).toHaveClass('max-w-4xl');
    });
  });

  describe('Body scroll lock', () => {
    it('should prevent body scroll when open', () => {
      render(<Modal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />);

      rerender(<Modal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });
  });
});
