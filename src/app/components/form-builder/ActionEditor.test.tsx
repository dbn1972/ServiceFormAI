/**
 * Tests for the ActionEditor component.
 *
 * Verifies listing, adding, editing, removing actions, event type dropdown,
 * test action execution, inline prohibited construct warnings, and
 * pre-built action selection and configuration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActionDefinition } from '@serviceformai/validation-engine';
import ActionEditor from './ActionEditor';

// ---------------------------------------------------------------------------
// Mock the sandbox-worker module
// ---------------------------------------------------------------------------

let mockWorkerInstance: {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: (() => void) | null;
};

vi.mock('../../actions/sandbox-worker', () => ({
  createSandboxWorker: vi.fn(() => {
    mockWorkerInstance = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
    };
    return mockWorkerInstance;
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAction(overrides?: Partial<ActionDefinition>): ActionDefinition {
  return {
    id: 'action-1',
    event: 'onFieldChange',
    targetId: 'field-1',
    code: 'setFieldValue("field-2", getFieldValue("field-1") + 1)',
    description: 'Test action',
    enabled: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ActionEditor', () => {
  let onUpdateActions: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onUpdateActions = vi.fn();
  });

  // ── Listing Actions ─────────────────────────────────────────────────

  describe('listing actions', () => {
    it('displays "No actions" message when no actions are attached', () => {
      render(
        <ActionEditor
          fieldId="field-1"
          actions={[]}
          onUpdateActions={onUpdateActions}
        />,
      );

      expect(screen.getByText(/no actions attached/i)).toBeInTheDocument();
    });

    it('lists actions attached to the selected field', () => {
      const actions = [
        makeAction({ id: 'a1', description: 'First action', targetId: 'field-1' }),
        makeAction({ id: 'a2', description: 'Second action', targetId: 'field-1' }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      expect(screen.getByText('First action')).toBeInTheDocument();
      expect(screen.getByText('Second action')).toBeInTheDocument();
    });

    it('only shows actions for the selected field', () => {
      const actions = [
        makeAction({ id: 'a1', description: 'My field action', targetId: 'field-1' }),
        makeAction({ id: 'a2', description: 'Other field action', targetId: 'field-2' }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      expect(screen.getByText('My field action')).toBeInTheDocument();
      expect(screen.queryByText('Other field action')).not.toBeInTheDocument();
    });

    it('shows disabled indicator for disabled actions', () => {
      const actions = [
        makeAction({ id: 'a1', description: 'Disabled action', targetId: 'field-1', enabled: false }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      expect(screen.getByText('(disabled)')).toBeInTheDocument();
    });
  });

  // ── Adding Actions ──────────────────────────────────────────────────

  describe('adding actions', () => {
    it('shows "Add Custom Action" button', () => {
      render(
        <ActionEditor
          fieldId="field-1"
          actions={[]}
          onUpdateActions={onUpdateActions}
        />,
      );

      expect(screen.getByText(/add custom action/i)).toBeInTheDocument();
    });

    it('calls onUpdateActions with a new action when Add is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ActionEditor
          fieldId="field-1"
          actions={[]}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText(/add custom action/i));

      expect(onUpdateActions).toHaveBeenCalledTimes(1);
      const newActions = onUpdateActions.mock.calls[0][0] as ActionDefinition[];
      expect(newActions).toHaveLength(1);
      expect(newActions[0].event).toBe('onFieldChange');
      expect(newActions[0].targetId).toBe('field-1');
      expect(newActions[0].enabled).toBe(true);
    });
  });

  // ── Removing Actions ────────────────────────────────────────────────

  describe('removing actions', () => {
    it('removes an action when the remove button is clicked', async () => {
      const user = userEvent.setup();
      const actions = [
        makeAction({ id: 'a1', description: 'Action to remove', targetId: 'field-1' }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      const removeButton = screen.getByRole('button', { name: /remove action/i });
      await user.click(removeButton);

      expect(onUpdateActions).toHaveBeenCalledWith([]);
    });
  });

  // ── Editing Actions ─────────────────────────────────────────────────

  describe('editing actions', () => {
    it('opens the editor when Edit is clicked', async () => {
      const user = userEvent.setup();
      const actions = [
        makeAction({ id: 'a1', description: 'Editable action', targetId: 'field-1' }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Edit'));

      // Should show the code editor textarea
      expect(screen.getByLabelText(/action code/i)).toBeInTheDocument();
      // Should show event type dropdown
      expect(screen.getByLabelText(/event type/i)).toBeInTheDocument();
    });

    it('shows the event type dropdown with all event options', async () => {
      const user = userEvent.setup();
      const actions = [
        makeAction({ id: 'a1', targetId: 'field-1' }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Edit'));

      const select = screen.getByLabelText(/event type/i);
      const options = within(select as HTMLElement).getAllByRole('option');
      const optionValues = options.map((o) => (o as HTMLOptionElement).value);

      expect(optionValues).toContain('onFieldChange');
      expect(optionValues).toContain('onFieldBlur');
      expect(optionValues).toContain('onFormLoad');
      expect(optionValues).toContain('onFormSubmit');
      expect(optionValues).toContain('onButtonClick');
    });

    it('shows API reference toggle', async () => {
      const user = userEvent.setup();
      const actions = [
        makeAction({ id: 'a1', targetId: 'field-1' }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Edit'));

      const apiToggle = screen.getByText(/show api reference/i);
      expect(apiToggle).toBeInTheDocument();

      // Click to show API reference
      await user.click(apiToggle);
      // The API reference pre block should be visible
      expect(screen.getByText(/Restricted API — available inside action code/)).toBeInTheDocument();
    });
  });

  // ── Prohibited Construct Warnings ───────────────────────────────────

  describe('prohibited construct warnings', () => {
    it('displays inline warnings for prohibited constructs in code', async () => {
      const user = userEvent.setup();
      const actions = [
        makeAction({
          id: 'a1',
          targetId: 'field-1',
          code: 'eval("bad code")',
        }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Edit'));

      // Should show warning about eval
      expect(screen.getByText(/prohibited construct detected: "eval"/i)).toBeInTheDocument();
    });

    it('disables save button when prohibited constructs are detected', async () => {
      const user = userEvent.setup();
      const actions = [
        makeAction({
          id: 'a1',
          targetId: 'field-1',
          code: 'document.getElementById("x")',
        }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Edit'));

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).toBeDisabled();
    });

    it('does not show warnings for clean code', async () => {
      const user = userEvent.setup();
      const actions = [
        makeAction({
          id: 'a1',
          targetId: 'field-1',
          code: 'setFieldValue("field-2", 42)',
        }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Edit'));

      expect(screen.queryByText(/prohibited construct/i)).not.toBeInTheDocument();
    });
  });

  // ── Test Action Button ──────────────────────────────────────────────

  describe('test action button', () => {
    it('shows a Test Action button in the editor', async () => {
      const user = userEvent.setup();
      const actions = [
        makeAction({ id: 'a1', targetId: 'field-1' }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Edit'));

      expect(screen.getByText('Test Action')).toBeInTheDocument();
    });

    it('disables Test Action button when code is empty', async () => {
      const user = userEvent.setup();
      const actions = [
        makeAction({ id: 'a1', targetId: 'field-1', code: '' }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Edit'));

      const testButton = screen.getByText('Test Action').closest('button');
      expect(testButton).toBeDisabled();
    });
  });

  // ── Tab Switching ───────────────────────────────────────────────────

  describe('tab switching', () => {
    it('shows Custom Actions tab by default', () => {
      render(
        <ActionEditor
          fieldId="field-1"
          actions={[]}
          onUpdateActions={onUpdateActions}
        />,
      );

      expect(screen.getByText('Custom Actions')).toBeInTheDocument();
      expect(screen.getByText('Pre-Built Actions')).toBeInTheDocument();
    });

    it('switches to Pre-Built Actions tab', async () => {
      const user = userEvent.setup();

      render(
        <ActionEditor
          fieldId="field-1"
          actions={[]}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Pre-Built Actions'));

      // Should show pre-built action types
      expect(screen.getByText(/auto calculate/i)).toBeInTheDocument();
      expect(screen.getByText(/auto format phone/i)).toBeInTheDocument();
      expect(screen.getByText(/auto format currency/i)).toBeInTheDocument();
      expect(screen.getByText(/conditional api lookup/i)).toBeInTheDocument();
      expect(screen.getByText(/field dependency/i)).toBeInTheDocument();
    });
  });

  // ── Pre-Built Actions Tab ───────────────────────────────────────────

  describe('pre-built actions tab', () => {
    it('shows descriptions for each pre-built action type', async () => {
      const user = userEvent.setup();

      render(
        <ActionEditor
          fieldId="field-1"
          actions={[]}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Pre-Built Actions'));

      expect(screen.getByText(/automatically sums/i)).toBeInTheDocument();
      expect(screen.getByText(/formats a phone number/i)).toBeInTheDocument();
      expect(screen.getByText(/formats a number field/i)).toBeInTheDocument();
      expect(screen.getByText(/calls a configured api/i)).toBeInTheDocument();
      expect(screen.getByText(/sets a target field/i)).toBeInTheDocument();
    });

    it('shows configuration form when a pre-built action is selected', async () => {
      const user = userEvent.setup();

      render(
        <ActionEditor
          fieldId="field-1"
          actions={[]}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Pre-Built Actions'));

      // Click on auto-format-phone
      await user.click(screen.getByText(/auto format phone/i));

      // Should show the phone format description
      expect(screen.getByText(/will format the current field/i)).toBeInTheDocument();
      // Should show Add Action button
      expect(screen.getByText('Add Action')).toBeInTheDocument();
    });

    it('shows source/target fields config for auto-calculate', async () => {
      const user = userEvent.setup();

      render(
        <ActionEditor
          fieldId="field-1"
          actions={[]}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Pre-Built Actions'));
      await user.click(screen.getByText(/auto calculate/i));

      expect(screen.getByText(/source field ids/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/field_1, field_2/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/total_field/)).toBeInTheDocument();
    });

    it('generates and adds a pre-built action when configured', async () => {
      const user = userEvent.setup();

      render(
        <ActionEditor
          fieldId="field-1"
          actions={[]}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Pre-Built Actions'));
      await user.click(screen.getByText(/auto format phone/i));
      await user.click(screen.getByText('Add Action'));

      expect(onUpdateActions).toHaveBeenCalledTimes(1);
      const newActions = onUpdateActions.mock.calls[0][0] as ActionDefinition[];
      expect(newActions).toHaveLength(1);
      expect(newActions[0].event).toBe('onFieldBlur');
      expect(newActions[0].targetId).toBe('field-1');
      expect(newActions[0].code).toContain('+91');
    });
  });

  // ── Accessibility ───────────────────────────────────────────────────

  describe('accessibility', () => {
    it('has an accessible region label', () => {
      render(
        <ActionEditor
          fieldId="field-1"
          actions={[]}
          onUpdateActions={onUpdateActions}
        />,
      );

      expect(screen.getByRole('region', { name: /action editor/i })).toBeInTheDocument();
    });

    it('prohibited construct warnings have alert role', async () => {
      const user = userEvent.setup();
      const actions = [
        makeAction({
          id: 'a1',
          targetId: 'field-1',
          code: 'eval("bad")',
        }),
      ];

      render(
        <ActionEditor
          fieldId="field-1"
          actions={actions}
          onUpdateActions={onUpdateActions}
        />,
      );

      await user.click(screen.getByText('Edit'));

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });
});
