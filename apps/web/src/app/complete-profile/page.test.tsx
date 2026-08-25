import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompleteProfilePage from "./page";
import { AuthProvider } from "@/components/auth/AuthProvider";
import * as api from "@/lib/api";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return { ...actual, completeProfile: vi.fn(), getMe: vi.fn() };
});

async function submitProfile() {
  vi.mocked(api.getMe).mockResolvedValue({
    user: {
      id: "u1",
      phone: "+989121110001",
      firstName: null,
      lastName: null,
      birthDate: null,
      role: "customer",
    },
  });
  vi.mocked(api.completeProfile).mockResolvedValue({
    user: {
      id: "u1",
      phone: "+989121110001",
      firstName: "علی",
      lastName: "رضایی",
      birthDate: null,
      role: "customer",
    },
  });

  const user = userEvent.setup();
  render(
    <AuthProvider>
      <CompleteProfilePage />
    </AuthProvider>,
  );

  await user.type(await screen.findByLabelText("نام", { exact: true }), "علی");
  await user.type(screen.getByLabelText("نام خانوادگی"), "رضایی");
  await user.click(screen.getByRole("button", { name: "ادامه" }));
  await waitFor(() => expect(api.completeProfile).toHaveBeenCalled());
}

describe("CompleteProfilePage returnTo", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockSearchParams = new URLSearchParams();
  });

  it("continues to a safe internal returnTo after signup", async () => {
    mockSearchParams = new URLSearchParams({ returnTo: "/products/lumbar-belt" });
    await submitProfile();
    expect(mockPush).toHaveBeenCalledWith("/products/lumbar-belt");
  });

  it("defaults to /account when there is no returnTo", async () => {
    await submitProfile();
    expect(mockPush).toHaveBeenCalledWith("/account");
  });
});
