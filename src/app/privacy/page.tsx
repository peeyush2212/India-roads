export default function Page() {
  return (
    <div className="prose prose-sm max-w-3xl dark:prose-invert">
      <h1>Privacy</h1>
      <p>
        This demo stores scenarios and the “premium unlocked” flag locally in your browser (localStorage). No
        personal data is sent to a server unless you configure Stripe and click the Stripe checkout button.
      </p>
      <p>
        If you deploy this publicly, consider adding analytics and a proper privacy notice appropriate to your use
        case.
      </p>
    </div>
  );
}
