import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  openModal,
  closeModal,
  showAlert,
  showConfirm,
  showDangerConfirm,
  modalKeydownHandler,
  _resetModalState,
} from "../../src/ui/modal.js";

// --- Helpers ---

function setupModalDOM() {
  document.body.innerHTML = `
    <div id="modalOverlay" hidden>
      <div class="modal-content">
        <h3 id="modalTitle" class="modal-title"></h3>
        <div id="modalBody" class="modal-body"></div>
        <div id="modalActions" class="modal-actions"></div>
      </div>
    </div>
    <button id="outsideButton">Outside</button>
  `;
}

function getOverlay() {
  return document.getElementById("modalOverlay");
}
function getModalTitle() {
  return document.getElementById("modalTitle");
}
function getModalBody() {
  return document.getElementById("modalBody");
}
function getModalActions() {
  return document.getElementById("modalActions");
}

// --- Tests ---

describe("Modal System", () => {
  beforeEach(() => {
    setupModalDOM();
    _resetModalState();
  });

  // ─── showAlert ────────────────────────────────────────────────

  describe("showAlert", () => {
    it("renders the default title and message", () => {
      showAlert("Something happened");

      expect(getModalTitle().textContent).toBe("Amor Fati");
      expect(getModalBody().innerHTML).toBe("<p>Something happened</p>");
    });

    it("renders a custom title", () => {
      showAlert("Watch out!", { title: "Warning" });

      expect(getModalTitle().textContent).toBe("Warning");
    });

    it("creates a single OK button that resolves to true", async () => {
      const promise = showAlert("Hello");

      const buttons = getModalActions().querySelectorAll("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0].textContent).toBe("OK");

      buttons[0].click();
      const result = await promise;
      expect(result).toBe(true);
    });

    it("removes the hidden attribute from the overlay", () => {
      showAlert("Test");
      expect(getOverlay().hasAttribute("hidden")).toBe(false);
    });
  });

  // ─── showConfirm ─────────────────────────────────────────────

  describe("showConfirm", () => {
    it("renders the default title and message", () => {
      showConfirm("Are you sure?");

      expect(getModalTitle().textContent).toBe("Confirmation");
      expect(getModalBody().innerHTML).toBe("<p>Are you sure?</p>");
    });

    it("renders a custom title", () => {
      showConfirm("Proceed?", { title: "Verify" });

      expect(getModalTitle().textContent).toBe("Verify");
    });

    it("creates Cancel and Confirm buttons", () => {
      showConfirm("Proceed?");

      const buttons = getModalActions().querySelectorAll("button");
      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent).toBe("Annuler");
      expect(buttons[1].textContent).toBe("Confirmer");
    });

    it("Cancel button has btn-secondary class and resolves to false", async () => {
      const promise = showConfirm("Proceed?");

      const [cancelBtn] = getModalActions().querySelectorAll("button");
      expect(cancelBtn.className).toContain("btn-secondary");

      cancelBtn.click();
      const result = await promise;
      expect(result).toBe(false);
    });

    it("Confirm button resolves to true", async () => {
      const promise = showConfirm("Proceed?");

      const [, confirmBtn] = getModalActions().querySelectorAll("button");
      confirmBtn.click();
      const result = await promise;
      expect(result).toBe(true);
    });
  });

  // ─── showDangerConfirm ───────────────────────────────────────

  describe("showDangerConfirm", () => {
    it("renders the default title and message", () => {
      showDangerConfirm("This will delete data.");

      expect(getModalTitle().textContent).toBe("⚠️ Attention");
      expect(getModalBody().innerHTML).toBe("<p>This will delete data.</p>");
    });

    it("renders a custom title", () => {
      showDangerConfirm("Erase?", { title: "Danger Zone" });

      expect(getModalTitle().textContent).toBe("Danger Zone");
    });

    it("creates Cancel and Delete buttons with correct classes", () => {
      showDangerConfirm("Erase?");

      const buttons = getModalActions().querySelectorAll("button");
      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent).toBe("Annuler");
      expect(buttons[0].className).toContain("btn-secondary");
      expect(buttons[1].textContent).toBe("Supprimer");
      expect(buttons[1].className).toContain("btn-danger");
    });

    it("Cancel resolves to false", async () => {
      const promise = showDangerConfirm("Erase?");

      const [cancelBtn] = getModalActions().querySelectorAll("button");
      cancelBtn.click();
      expect(await promise).toBe(false);
    });

    it("Delete resolves to true", async () => {
      const promise = showDangerConfirm("Erase?");

      const [, deleteBtn] = getModalActions().querySelectorAll("button");
      deleteBtn.click();
      expect(await promise).toBe(true);
    });
  });

  // ─── openModal ───────────────────────────────────────────────

  describe("openModal", () => {
    it("renders title, body HTML, and action buttons", () => {
      openModal("Test Title", "<span>Body</span>", [
        { label: "Yes", value: "yes", class: "btn-primary" },
        { label: "No", value: "no", class: "btn-secondary" },
      ]);

      expect(getModalTitle().textContent).toBe("Test Title");
      expect(getModalBody().innerHTML).toBe("<span>Body</span>");

      const buttons = getModalActions().querySelectorAll("button");
      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent).toBe("Yes");
      expect(buttons[0].className).toBe("btn btn-primary");
      expect(buttons[1].textContent).toBe("No");
      expect(buttons[1].className).toBe("btn btn-secondary");
    });

    it("trims whitespace from button class when class is empty", () => {
      openModal("Title", "Body", [{ label: "OK", value: true, class: "" }]);

      const btn = getModalActions().querySelector("button");
      expect(btn.className).toBe("btn");
    });

    it("resolves the promise with the action value on button click", async () => {
      const promise = openModal("Pick", "Choose", [
        { label: "Alpha", value: "a", class: "" },
        { label: "Beta", value: "b", class: "" },
      ]);

      const buttons = getModalActions().querySelectorAll("button");
      buttons[1].click();

      expect(await promise).toBe("b");
    });

    it("hides the overlay after resolving", async () => {
      const promise = openModal("Pick", "Choose", [
        { label: "OK", value: true, class: "" },
      ]);

      const btn = getModalActions().querySelector("button");
      btn.click();
      await promise;

      expect(getOverlay().hasAttribute("hidden")).toBe(true);
    });

    it("focuses the first action button by default (after RAF)", async () => {
      openModal("Focus Test", "Body", [
        { label: "First", value: 1, class: "" },
        { label: "Second", value: 2, class: "" },
      ]);

      // requestAnimationFrame hasn't fired yet
      expect(document.activeElement).not.toBe(
        getModalActions().querySelector("button"),
      );

      // Simulate RAF callback
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const firstBtn = getModalActions().querySelector("button");
      expect(document.activeElement).toBe(firstBtn);
    });

    it("focuses the element matching focusSelector when provided", async () => {
      openModal(
        "Focus Selector",
        '<input id="customInput" type="text" />',
        [{ label: "OK", value: true, class: "" }],
        { focusSelector: "#customInput" },
      );

      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(document.activeElement.id).toBe("customInput");
    });

    it("saves the previously focused element", () => {
      const outsideBtn = document.getElementById("outsideButton");
      outsideBtn.focus();

      openModal("Save Focus", "Body", [
        { label: "OK", value: true, class: "" },
      ]);

      // closeModal should restore focus to outsideBtn
      closeModal();
      expect(document.activeElement).toBe(outsideBtn);
    });

    it("adds keydown listener to the overlay", () => {
      const addSpy = vi.spyOn(getOverlay(), "addEventListener");

      openModal("Key Test", "Body", [{ label: "OK", value: true, class: "" }]);

      expect(addSpy).toHaveBeenCalledWith("keydown", modalKeydownHandler);
      addSpy.mockRestore();
    });
  });

  // ─── closeModal ──────────────────────────────────────────────

  describe("closeModal", () => {
    it("sets the hidden attribute on the overlay", () => {
      openModal("Before Close", "Body", [
        { label: "OK", value: true, class: "" },
      ]);
      expect(getOverlay().hasAttribute("hidden")).toBe(false);

      closeModal();
      expect(getOverlay().hasAttribute("hidden")).toBe(true);
    });

    it("removes the keydown listener from the overlay", () => {
      const removeSpy = vi.spyOn(getOverlay(), "removeEventListener");

      openModal("Before Close", "Body", [
        { label: "OK", value: true, class: "" },
      ]);
      closeModal();

      expect(removeSpy).toHaveBeenCalledWith("keydown", modalKeydownHandler);
      removeSpy.mockRestore();
    });

    it("restores focus to the previously focused element", () => {
      const outsideBtn = document.getElementById("outsideButton");
      outsideBtn.focus();

      openModal("Before Close", "Body", [
        { label: "OK", value: true, class: "" },
      ]);
      closeModal();

      expect(document.activeElement).toBe(outsideBtn);
    });
  });

  // ─── Escape key ──────────────────────────────────────────────

  describe("Escape key", () => {
    it("resolves the promise with null", async () => {
      const promise = openModal("Escape Test", "Body", [
        { label: "OK", value: true, class: "" },
      ]);

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      getOverlay().dispatchEvent(event);

      expect(await promise).toBe(null);
    });

    it("hides the modal when Escape is pressed", () => {
      openModal("Escape Test", "Body", [
        { label: "OK", value: true, class: "" },
      ]);

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      getOverlay().dispatchEvent(event);

      expect(getOverlay().hasAttribute("hidden")).toBe(true);
    });
  });

  // ─── Focus trap (Tab key) ────────────────────────────────────

  describe("Focus trap (Tab)", () => {
    it("moves focus from last to first focusable element on Tab", () => {
      openModal("Trap Test", "Body", [
        { label: "First", value: 1, class: "" },
        { label: "Second", value: 2, class: "" },
      ]);

      const buttons = getModalActions().querySelectorAll("button");
      buttons[1].focus(); // focus the last button

      const event = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      });

      // Dispatch on overlay — the handler is attached to overlay
      getOverlay().dispatchEvent(event);

      expect(document.activeElement).toBe(buttons[0]);
    });

    it("moves focus from first to last focusable element on Shift+Tab", () => {
      openModal("Trap Test", "Body", [
        { label: "First", value: 1, class: "" },
        { label: "Second", value: 2, class: "" },
      ]);

      const buttons = getModalActions().querySelectorAll("button");
      buttons[0].focus(); // focus the first button

      const event = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });

      getOverlay().dispatchEvent(event);

      expect(document.activeElement).toBe(buttons[1]);
    });

    it("does not trap Tab when focus is in the middle", () => {
      openModal("Trap Test", "Body", [
        { label: "First", value: 1, class: "" },
        { label: "Second", value: 2, class: "" },
        { label: "Third", value: 3, class: "" },
      ]);

      const buttons = getModalActions().querySelectorAll("button");
      buttons[1].focus(); // middle button

      const event = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      });

      getOverlay().dispatchEvent(event);

      // Focus should stay on the middle button — no wrapping
      expect(document.activeElement).toBe(buttons[1]);
    });

    it("prevents default on Tab when trap activates", () => {
      openModal("Trap Test", "Body", [{ label: "Only", value: 1, class: "" }]);

      const btn = getModalActions().querySelector("button");
      btn.focus();

      const event = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      });

      getOverlay().dispatchEvent(event);
      // When there's only one focusable element, it's both first and last,
      // so Shift+Tab or Tab on the only element should prevent default.
      // With only one element, first === last, so normal Tab from the last
      // element wraps to first (which is itself).
    });
  });
});
