import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description: string;
    icon?: ReactNode;
    action?: ReactNode;
}

export default function PageHeader({
                                       title,
                                       description,
                                       icon,
                                       action
                                   }: PageHeaderProps) {
    return (
        <div className="page-header">
            <div className="page-header-main">
                {icon && (
                    <div className="page-header-icon">
                        {icon}
                    </div>
                )}

                <div>
                    <h2>{title}</h2>
                    <p>{description}</p>
                </div>
            </div>

            {action && (
                <div className="page-header-action">
                    {action}
                </div>
            )}
        </div>
    );
}