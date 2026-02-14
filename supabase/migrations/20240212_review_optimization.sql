
-- 0. Ensure Foreign Key Relationship Exists
-- This is critical for the "products(name)" join to work in the UI
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'testimonials_product_id_fkey'
    ) THEN
        -- Clean up orphaned product IDs that might cause the constraint to fail
        UPDATE testimonials 
        SET product_id = NULL 
        WHERE product_id NOT IN (SELECT id FROM products);

        ALTER TABLE testimonials 
        ADD CONSTRAINT testimonials_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 1. Ensure Admins can see EVERYTHING in testimonials
-- This policy explicitly allows admins to bypass the is_active=true filter
DROP POLICY IF EXISTS "Admins can manage testimonials" ON testimonials;
CREATE POLICY "Admins can manage testimonials" ON testimonials 
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
);

-- 2. Ensure Public can only see active ones (redundant but safe)
DROP POLICY IF EXISTS "Public can view active testimonials" ON testimonials;
CREATE POLICY "Public can view active testimonials" ON testimonials 
FOR SELECT 
TO public
USING (is_active = true);

-- 3. Trigger to Update Product Stats when a review is ADDED or UPDATED
-- This keeps the avg_rating and review_count in the products table in sync
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the review is ACTIVE
    IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR 
       (TG_OP = 'UPDATE' AND NEW.is_active = true) OR
       (TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false) OR
       (TG_OP = 'DELETE' AND OLD.is_active = true) THEN
        
        UPDATE products
        SET 
            avg_rating = (
                SELECT COALESCE(AVG(rating), 5.0) 
                FROM testimonials 
                WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
                AND is_active = true
            ),
            review_count = (
                SELECT COUNT(*) 
                FROM testimonials 
                WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
                AND is_active = true
            )
        WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_product_review_stats ON testimonials;
CREATE TRIGGER tr_update_product_review_stats
AFTER INSERT OR UPDATE OR DELETE ON testimonials
FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();
