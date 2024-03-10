import { Amplify } from 'aws-amplify'
import awsconfig from '../aws-exports';

Amplify.configure({
  ...awsconfig,
  ssr: true
});

export const AmplifyConfig = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <>{children}</>
  )
}