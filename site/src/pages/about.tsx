import { Metadata } from 'bun-react-ssg'

import { Layout } from '@/components/Layout'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'About Us',
}

function AboutPage() {
  return (
    <Layout>
      <h1>About Us</h1>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Provident odio
        ab magnam fugit ad mollitia nemo molestias sed, accusamus quas voluptas
        libero placeat ullam sapiente ea molestiae aliquam quo laudantium!
      </p>
    </Layout>
  )
}

export default AboutPage
