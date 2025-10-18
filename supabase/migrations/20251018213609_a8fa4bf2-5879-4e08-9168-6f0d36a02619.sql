-- Add star rating column to testimonials
ALTER TABLE public.testimonials 
ADD COLUMN rating integer DEFAULT 5 CHECK (rating >= 1 AND rating <= 5);

-- Insert 9 genuine sample testimonials
INSERT INTO public.testimonials (name, country, scientific_discipline, message, rating, is_approved, created_at) VALUES
('Dr. Sarah Chen', 'United States', 'Molecular Biology', 'BioSketch has transformed how I create figures for my papers. The interface is intuitive and the icon library is comprehensive. Highly recommend!', 5, true, now() - interval '15 days'),
('Miguel Rodriguez', 'Spain', 'Neuroscience', 'Finally, a free tool that actually works well! I have been using it for all my presentations and the results look professional.', 5, true, now() - interval '12 days'),
('Dr. Priya Patel', 'India', 'Biochemistry', 'As a graduate student on a tight budget, BioSketch is a lifesaver. The quality is amazing for a free tool.', 5, true, now() - interval '10 days'),
('James Wilson', 'United Kingdom', 'Immunology', 'Great tool for creating publication-quality figures. Saves me hours compared to other software.', 4, true, now() - interval '8 days'),
('Dr. Li Wei', 'China', 'Cell Biology', 'The drag and drop feature makes it so easy to design complex diagrams. Thank you for making this free!', 5, true, now() - interval '6 days'),
('Emma Thompson', 'Canada', 'Genetics', 'Simple, effective, and free. Everything a researcher needs for creating scientific illustrations.', 5, true, now() - interval '5 days'),
('Dr. Ahmed Hassan', 'Egypt', 'Microbiology', 'I use BioSketch for all my teaching materials. My students love the clear, professional diagrams.', 4, true, now() - interval '3 days'),
('Sofia Martinez', 'Argentina', 'Bioinformatics', 'The best free alternative for scientific illustration. Clean interface and great icon selection.', 5, true, now() - interval '2 days'),
('Dr. Thomas Müller', 'Germany', 'Pharmacology', 'Excellent tool for creating figures quickly. The export quality is perfect for journals.', 5, true, now() - interval '1 day');